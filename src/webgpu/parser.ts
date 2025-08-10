import { WgslReflect } from 'wgsl_reflect';

export interface ParsedError {
  message: string;
  line: number;
  column?: number;
  severity: 'error';
}

// Get the number of lines in the injected header for line offset calculations
export function getHeaderLineOffset(): number {
  // Empirically determined: WebGPU error line numbers need to be adjusted by 13
  // This accounts for:
  // 1. injectedHeader template literal structure (leading newline + 11 declarations + trailing newline = 13 lines)
  // 2. Additional '\n' added in renderer.ts when concatenating header + user code
  // 3. Possible other whitespace/formatting differences in the compilation process
  return 13;
}

export function parseWGSL(wgslCode: string) {
  try {
    const reflect = new WgslReflect(wgslCode);
    const entries = reflect.entry;

    const hasFragment = entries.fragment.length > 0;
    const hasVertex = entries.vertex.length > 0;
    const hasCompute = entries.compute.length > 0;

    if (hasFragment) {
      return {
        type: hasVertex ? 'vertex-fragment' : 'fragment-only',
        entryPoints: entries,
        valid: true,
        warnings: [
          ...(hasVertex && !hasFragment ? ['Note: vertex shader detected but no fragment.'] : []),
          ...(hasCompute ? ['Note: compute shader detected but ignored.'] : []),
        ],
      };
    } else {
      return {
        type: 'invalid',
        valid: false,
        message: 'A fragment shader entry point is required to render to screen.',
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      type: 'error',
      valid: false,
      error: message,
    };
  }
}

// Parse WebGPU compilation error messages into structured error objects
export function parseWebGPUErrors(errorMessage: string, headerLineOffset: number = 0): ParsedError[] {
  const errors: ParsedError[] = [];

  if (!errorMessage) return errors;

  // Check if the message contains actual errors, even if it also has success messages
  const hasErrors = errorMessage.includes('[error]') ||
                   errorMessage.includes('error:') ||
                   errorMessage.includes('compilation failed') ||
                   errorMessage.includes('Invalid') ||
                   errorMessage.includes('Expected');

  if (!hasErrors) {
    // Skip success messages and informational messages - don't treat them as errors
    const nonErrorPatterns = [
      /compiled\s+and\s+executed\s+successfully/i,
      /successfully/i,
      /shader\s+compiled/i,
      /compilation\s+successful/i,
      /no\s+errors/i,
      /detected\s+shader\s+type/i,
      /initializing\s+webgpu/i,
      /creating\s+/i,
      /loaded\s+/i,
      /texture\s+provided/i,
      /^shader\s+type:/i,
      /^webgpu\s+/i
    ];

    for (const pattern of nonErrorPatterns) {
      if (pattern.test(errorMessage)) {
        return errors; // Return empty array for non-error messages
      }
    }
  }

  // Common WebGPU and parser error patterns
  const patterns = [
    // Pattern for WebGPU compilation errors: "[error] L17:39 unresolved value 'undefinedVariable'"
    /\[error\]\s*L(\d+):(\d+)\s+(.+)/gi,

    // Pattern for parser errors: "Expected ')' for argument list. Line:3"
    /(.+?)\.\s*Line:(\d+)/gi,

    // Pattern for parser errors with double dots: "Expected ';' after statement.. Line:6"
    /(.+?)\.\.\s*Line:(\d+)/gi,

    // Pattern for errors: "shader compilation failed at line 15, column 5: error message"
    /(?:shader\s+)?(?:compilation\s+)?(?:failed\s+)?(?:at\s+)?line\s*[:\s]\s*(\d+)(?:,?\s*column\s*[:\s]\s*(\d+))?\s*[:\s]\s*(.+)/gi,

    // Pattern for errors: "15:5 - error: message"
    /(\d+):(\d+)\s*-\s*(error|warning|info)\s*:\s*(.+)/gi,

    // Pattern for compilation errors: "error: undeclared identifier 'variable' at line 4"
    /error\s*:\s*(.+?)\s+at\s+line\s+(\d+)/gi,

    // Pattern for errors: "at line 15, column 8: undeclared identifier"
    /at\s+line\s+(\d+)(?:,\s*column\s+(\d+))?\s*:\s*(.+)/gi,

    // Pattern for errors: "Line 15: error message"
    /line\s+(\d+)\s*:\s*(?!.*success)(.+)/gi,

    // Pattern for errors: "15: error message"
    /^(\d+)\s*:\s*(.+)/gmi,

    // Pattern for general error messages with line numbers
    /(\d+)\s*:\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex state

    while ((match = pattern.exec(errorMessage)) !== null) {
      let line: number;
      let column: number | undefined;
      let message: string;

      // Handle different capture group patterns based on the match structure
      if (match[0].includes('[error]') && match[0].includes('L')) {
        // WebGPU compilation error: "[error] L17:39 unresolved value 'undefinedVariable'"
        line = parseInt(match[1], 10);
        column = parseInt(match[2], 10);
        message = match[3].trim();
      } else if (match[0].includes('. Line:') || match[0].includes('.. Line:')) {
        // Parser error: "Expected ')' for argument list. Line:3"
        message = match[1].trim();
        line = parseInt(match[2], 10);
      } else if (match[0].includes('at line') && !match[0].includes('[error]')) {
        // Pattern: "Expected ';' after statement at line 6" (but not compilation errors)
        message = match[1].trim();
        line = parseInt(match[2], 10);
      } else if (match[0].includes('error:') && match[0].includes('at line')) {
        // Pattern: "error: undeclared identifier 'variable' at line 4"
        message = match[1].trim();
        line = parseInt(match[2], 10);
      } else if (match.length === 5 && match[3] && /^error$/i.test(match[3])) {
        // Pattern with line, column, and error message: "15:5 - error: message"
        line = parseInt(match[1], 10);
        column = parseInt(match[2], 10);
        message = match[4].trim();
      } else if (match.length >= 4 && match[2] && /^\d+$/.test(match[2])) {
        // Pattern with line and column: "at line 15, column 8: message"
        line = parseInt(match[1], 10);
        column = parseInt(match[2], 10);
        message = match[3].trim();
      } else if (match.length >= 3) {
        // Pattern with line and message: "line 15: message" or "15: message"
        line = parseInt(match[1], 10);
        message = (match[2] || match[3] || '').trim();
      } else {
        continue; // Skip if we can't parse it properly
      }

      if (line > 0 && message) {
        let adjustedLine = line;

        // Only apply header offset for WebGPU compilation errors
        // Parser errors (syntax errors) are already relative to user code
        const isCompilationError = match[0].includes('[error]') ||
                                  match[0].includes('compilation') ||
                                  match[0].includes('unresolved') ||
                                  match[0].includes('Invalid');

        if (isCompilationError) {
          adjustedLine = Math.max(1, line - headerLineOffset);
          console.log(`Compilation error - Line adjustment: original=${line}, offset=${headerLineOffset}, adjusted=${adjustedLine}`);
        } else {
          console.log(`Parser error - Using original line: ${line}`);
        }

        errors.push({
          line: adjustedLine,
          column,
          severity: 'error',
          message: cleanErrorMessage(message)
        });

        // Break out of pattern loop once we've found and processed errors
        // This prevents multiple patterns from matching the same error
        break;
      }
    }

    // If we found errors with this pattern, don't try other patterns
    if (errors.length > 0) {
      break;
    }
  }

  // If no structured errors found, try to extract any line numbers
  if (errors.length === 0) {
    const linePattern = /line\s*[:\s]\s*(\d+)/gi;
    let match;

    while ((match = linePattern.exec(errorMessage)) !== null) {
      const line = parseInt(match[1], 10);
      if (line > 0) {
        // Adjust line number to account for injected header
        const adjustedLine = Math.max(1, line - headerLineOffset);

        errors.push({
          line: adjustedLine,
          severity: 'error',
          message: errorMessage.trim()
        });
        break; // Only add one generic error
      }
    }
  }

  // If still no errors but we have an error message, add a generic error at line 1
  if (errors.length === 0 && errorMessage.trim()) {
    errors.push({
      line: 1,
      severity: 'error',
      message: errorMessage.trim()
    });
  }

  return errors;
}

// Clean up error messages by removing redundant information
function cleanErrorMessage(message: string): string {
  return message
    // Remove line/column references that are now handled separately
    .replace(/(?:at\s+)?line\s+\d+(?:,?\s*column\s+\d+)?[:\s]*/gi, '')
    .replace(/^\d+:\d+\s*-\s*(?:error|warning|info)\s*:\s*/gi, '')
    .replace(/^error\s*:\s*/gi, '')
    .trim();
}

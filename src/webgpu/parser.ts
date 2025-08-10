import { WgslReflect } from 'wgsl_reflect';

export interface ParsedError {
  message: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
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

  // Common WebGPU error patterns
  const patterns = [
    // Pattern for errors like: "shader compilation failed at line 15, column 5: error message"
    /(?:shader\s+)?(?:compilation\s+)?(?:failed\s+)?(?:at\s+)?line\s*[:\s]\s*(\d+)(?:,?\s*column\s*[:\s]\s*(\d+))?\s*[:\s]\s*(.+)/gi,

    // Pattern for errors like: "15:5 - error: message"
    /(\d+):(\d+)\s*-\s*(error|warning|info)\s*:\s*(.+)/gi,

    // Pattern for errors like: "Line 15: error message" (but not success messages)
    /line\s+(\d+)\s*:\s*(?!.*success)(.+)/gi,

    // Pattern for errors like: "15: error message"
    /^(\d+)\s*:\s*(.+)/gmi,

    // Pattern for errors with line references: "at line 15" (but not success messages)
    /at\s+line\s+(\d+)(?:\s*:\s*(?!.*success)(.+))?/gi,
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex state

    while ((match = pattern.exec(errorMessage)) !== null) {
      const line = parseInt(match[1], 10);
      let column: number | undefined;
      let severity: 'error' | 'warning' | 'info' = 'error';
      let message: string;

      // Handle different capture group patterns
      if (match.length === 4 && match[2] && /^\d+$/.test(match[2])) {
        // Pattern with line and column
        column = parseInt(match[2], 10);
        message = match[3].trim();
      } else if (match.length === 5) {
        // Pattern with line, column, severity, and message
        column = parseInt(match[2], 10);
        severity = match[3].toLowerCase() as 'error' | 'warning' | 'info';
        message = match[4].trim();
      } else {
        // Pattern with just line and message
        message = (match[2] || match[3] || '').trim();
      }

      if (line > 0 && message) {
        // Adjust line number to account for injected header
        const adjustedLine = Math.max(1, line - headerLineOffset);

        errors.push({
          line: adjustedLine,
          column,
          severity,
          message: cleanErrorMessage(message)
        });
      }
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

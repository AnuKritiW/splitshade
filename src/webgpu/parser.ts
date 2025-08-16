import { WgslReflect } from 'wgsl_reflect';

/**
 * Represents a parsed WGSL compilation error with location information.
 */
export interface ParsedError {
  /** Human-readable error message */
  message: string;
  /** Line number where the error occurred (1-based) */
  line: number;
  /** Column number where the error occurred (1-based), if available */
  column?: number;
  /** Error severity type (error, warning, info), if available */
  type?: string;
}

// Define error detection patterns for reuse
const ERROR_DETECTION_PATTERNS = [
  '[error]',
  'error:',
  'WebGPU Error',
  'compilation failed',
  'Invalid',
  'Expected'
] as const;

const COMPILATION_ERROR_PATTERNS = [
  '[error]',
  'compilation',
  'unresolved',
  'Invalid'
] as const;

/**
 * Checks if a text string contains any of the specified patterns.
 *
 * @param text - Text to search within
 * @param patterns - Array of patterns to search for
 * @returns True if any pattern is found in the text
 */
function containsPattern(text: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => text.includes(pattern));
}

/**
 * Calculates the line offset needed to adjust error line numbers from injected shader headers.
 *
 * When WGSL shaders are compiled, additional header code is injected at the top.
 * Error line numbers from the compiler need to be adjusted to match the original user code.
 *
 * @param usesTextures - Whether the shader uses texture bindings (affects header size)
 * @returns Number of lines to subtract from compiler error line numbers
 *
 * @remarks
 * - With textures: 13 lines (includes uniform bindings for iChannel0-3, iTime, etc.)
 * - Without textures: 5 lines (minimal header with just iTime and iResolution)
 * - Values determined empirically by analyzing WebGPU compiler output
 */
export function getHeaderLineOffset(usesTextures: boolean = true): number {
  if (usesTextures) {
    // Empirically determined: WebGPU error line numbers need to be adjusted by 13
    // This accounts for injectedHeader template literal structure (leading newline + 11 declarations + trailing newline = 13 lines)
    return 13;
  } else {
    // Minimal header without textures: empirically determined to be 5 lines
    // This accounts for minimalHeader template literal structure (leading newline + 3 declarations + trailing newline = 5 lines)
    return 5;
  }
}

/**
 * Parses and analyzes WGSL shader code to determine its type and entry points.
 *
 * Uses wgsl_reflect to inspect the shader and determine what kind of shader it is
 * (fragment-only, vertex+fragment, compute, etc.) and validate its structure.
 *
 * @param wgslCode - WGSL shader source code to analyze
 * @returns Object describing the shader type, entry points, validity, and any warnings/errors
 *
 * @remarks
 * - Fragment-only shaders are the most common case for this application
 * - Vertex+fragment shaders are used when custom geometry is provided
 * - Compute shaders are currently unsupported
 * - Invalid shaders return error information for debugging
 */
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

/**
 * Parses error messages from WGSL compilation and converts them to structured error objects.
 *
 * Handles various error message formats from different parts of the WebGPU pipeline
 * and adjusts line numbers to account for injected shader headers.
 *
 * @param errorMessage - Raw error message string from WebGPU compiler or parser
 * @param headerLineOffset - Number of lines to subtract from error line numbers to account for injected headers
 * @returns Array of structured error objects with adjusted line numbers
 *
 * @remarks
 * - Filters out success messages and non-error information
 * - Supports multiple error message formats from different WebGPU implementations
 * - Line number adjustment is critical for accurate error reporting in the editor
 * - Returns empty array for non-error messages (success, info, etc.)
 */
export function parseErrorMessages(errorMessage: string, headerLineOffset: number = 0): ParsedError[] {
  const errors: ParsedError[] = [];

  if (!errorMessage) return errors;

  // Check if the message contains actual errors, even if it also has success messages
  const hasErrors = containsPattern(errorMessage, ERROR_DETECTION_PATTERNS);

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
        // Supports both:
        // 1) "at line N, column M: message"  (line-first, colon format)
        // 2) "message at line N"             (message-first format)

        if (match[3] && /:\s*/.test(match[0])) {
          // Shape 1: "at line N, column M: message"
          line = parseInt(match[1], 10);
          if (match[2] && /^\d+$/.test(match[2])) {
            column = parseInt(match[2], 10);
          }
          message = match[3].trim();
        } else {
          // Shape 2: "message at line N"
          message = (match[1] || '').trim();
          line = parseInt(match[2], 10);
        }
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
        const isCompilationError = containsPattern(match[0], COMPILATION_ERROR_PATTERNS);

        if (isCompilationError) {
          adjustedLine = Math.max(1, line - headerLineOffset);
        }

        errors.push({
          line: adjustedLine,
          column,
          message: cleanErrorMessage(message),
          type: 'error' // Set type as error for pattern-matched errors
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
          message: errorMessage.trim(),
          type: 'error' // Set type as error for generic line-based errors
        });
        break; // Only add one generic error
      }
    }
  }

  // If still no errors but we have an error message, add a generic error at line 1
  if (errors.length === 0 && errorMessage.trim()) {
    // Extract just the error part, removing informational messages
    const cleanedMessage = cleanErrorMessage(errorMessage)
      .replace(/^.*?Detected shader type:.*?(?=WebGPU Error|error:|Invalid|compilation failed)/s, '')
      .replace(/^.*?(?=WebGPU Error|error:|Invalid|compilation failed)/s, '')
      .trim();

    errors.push({
      line: 1,
      message: cleanedMessage || errorMessage.trim(),
      type: 'error' // Set type as error for fallback errors
    });
  }

  return errors;
}

/**
 * Cleans up error messages by removing redundant information and formatting artifacts.
 *
 * Removes compiler-specific prefixes, line/column references that are handled separately,
 * and other noise that makes error messages less readable to users.
 *
 * @param message - Raw error message from compiler
 * @returns Cleaned, user-friendly error message
 */
function cleanErrorMessage(message: string): string {
  return message
    // Remove informational prefixes that appear before errors
    .replace(/^.*?Detected shader type:.*?(?=WebGPU Error|error:|Invalid|compilation failed)/s, '')
    .replace(/^.*?(?=WebGPU Error|error:|Invalid|compilation failed)/s, '')
    // Remove line/column references that are now handled separately
    .replace(/(?:at\s+)?line\s+\d+(?:,?\s*column\s+\d+)?[:\s]*/gi, '')
    .replace(/^\d+:\d+\s*-\s*(?:error|warning|info)\s*:\s*/gi, '')
    .replace(/^error\s*:\s*/gi, '')
    .trim();
}

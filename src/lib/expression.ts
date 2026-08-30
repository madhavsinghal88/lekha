/**
 * Evaluates simple arithmetic like "1500 + 800 - 200" or "1200*3/2 + (50)".
 * Implemented without eval: tokenise, then shunting-yard to RPN.
 */
export function evaluateExpression(input: string): number | null {
  const tokens = tokenise(input);
  if (!tokens) return null;
  const rpn = toRPN(tokens);
  if (!rpn) return null;
  return evaluateRPN(rpn);
}

type Token = number | "+" | "-" | "*" | "/" | "(" | ")";

const PRECEDENCE: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

function tokenise(input: string): Token[] | null {
  const tokens: Token[] = [];
  const source = input.replace(/[,\s₹]/g, "").replace(/[x×]/gi, "*").replace(/÷/g, "/");
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (/[\d.]/.test(char)) {
      let numeric = "";
      while (i < source.length && /[\d.]/.test(source[i])) numeric += source[i++];
      const value = Number.parseFloat(numeric);
      if (!Number.isFinite(value)) return null;
      tokens.push(value);
      continue;
    }

    if ("+-*/()".includes(char)) {
      const previous = tokens[tokens.length - 1];
      const unary =
        (char === "-" || char === "+") &&
        (tokens.length === 0 || previous === "(" || typeof previous === "string");
      if (unary) {
        // Rewrite unary sign as (0 - x) so the RPN pass stays binary-only.
        tokens.push(0, char as Token);
        i += 1;
        continue;
      }
      tokens.push(char as Token);
      i += 1;
      continue;
    }

    return null;
  }

  return tokens.length ? tokens : null;
}

function toRPN(tokens: Token[]): Token[] | null {
  const output: Token[] = [];
  const operators: Token[] = [];

  for (const token of tokens) {
    if (typeof token === "number") {
      output.push(token);
    } else if (token === "(") {
      operators.push(token);
    } else if (token === ")") {
      let matched = false;
      while (operators.length) {
        const top = operators.pop()!;
        if (top === "(") {
          matched = true;
          break;
        }
        output.push(top);
      }
      if (!matched) return null;
    } else {
      while (operators.length) {
        const top = operators[operators.length - 1];
        if (top === "(" || PRECEDENCE[top as string] < PRECEDENCE[token]) break;
        output.push(operators.pop()!);
      }
      operators.push(token);
    }
  }

  while (operators.length) {
    const top = operators.pop()!;
    if (top === "(") return null;
    output.push(top);
  }

  return output;
}

function evaluateRPN(rpn: Token[]): number | null {
  const stack: number[] = [];

  for (const token of rpn) {
    if (typeof token === "number") {
      stack.push(token);
      continue;
    }
    const right = stack.pop();
    const left = stack.pop();
    if (right === undefined || left === undefined) return null;

    switch (token) {
      case "+":
        stack.push(left + right);
        break;
      case "-":
        stack.push(left - right);
        break;
      case "*":
        stack.push(left * right);
        break;
      case "/":
        if (right === 0) return null;
        stack.push(left / right);
        break;
      default:
        return null;
    }
  }

  if (stack.length !== 1) return null;
  const result = stack[0];
  return Number.isFinite(result) ? Math.round(result * 100) / 100 : null;
}

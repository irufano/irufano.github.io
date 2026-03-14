import hljs from "highlight.js";

export function highlightCode(code: string, language: string): string {
  if (hljs.getLanguage(language)) {
    return hljs.highlight(code, { language }).value;
  } else {
    return hljs.highlightAuto(code).value;
  }
}

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".vercel/**"] },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;

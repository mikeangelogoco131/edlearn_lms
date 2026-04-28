const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src/app/lib/api.ts");
let content = fs.readFileSync(filePath, "utf8");

// Add commas
content = content.replace(/}\s*async chatUsers/g, "},\n\n    async chatUsers");
content = content.replace(/}\s*async messageCreate/g, "},\n\n    async messageCreate");

fs.writeFileSync(filePath, content);
console.log("Fixed missing commas");

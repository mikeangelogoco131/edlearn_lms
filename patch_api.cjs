const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src/app/lib/api.ts");
let content = fs.readFileSync(filePath, "utf8");

const fallbacks = `
async function getDevMessageThreadFallback(otherUserId: string) {
  return {
    data: [],
    meta: {
      total: 0,
      limit: 20,
      pages: 0,
    },
  };
}

async function getDevChatUsersFallback() {
  return {
    data: [],
    meta: {
      total: 0,
      limit: 20,
      pages: 0,
    },
  };
}

`;

if (!content.includes("getDevMessageThreadFallback")) {
    content = content.replace("export const api = {", fallbacks + "export const api = {");
}

const newMessageThread = `async messageThread(otherUserId: string, params?: { after?: string; limit?: number }) {
      try {
        const qs = new URLSearchParams();
        if (params?.after) qs.set('after', params.after);
        if (typeof params?.limit === "number") qs.set('limit', String(params.limit));
        const suffix = qs.toString() ? \`?\${qs.toString()}\` : '';
        return await apiFetch<ApiListResponse<ApiMessage>>(
          \`/api/messages/thread/\${encodeURIComponent(otherUserId)}\${suffix}\`,
        );
      } catch (error) {
        console.error('Failed to fetch message thread, using fallback:', error);
        return getDevMessageThreadFallback(otherUserId);
      }
    }`;

const oldMessageThreadPart = "async messageThread(otherUserId: string, params?: { after?: string; \\r?\\n\\s*limit\\?: number \\}) \\{\\s*const qs = new URLSearchParams\\(\\);";
const messageThreadRegex = new RegExp(oldMessageThreadPart);
// Simplified replacement for the whole method block
const messageThreadBlockRegex = /async messageThread\(otherUserId: string, params\?: \{ after\?: string;\s*limit\?: number \}\) \{[\s\S]*?async chatUsers/;
content = content.replace(messageThreadBlockRegex, newMessageThread + "\n\n    async chatUsers");


const newChatUsers = `async chatUsers(params?: { q?: string; limit?: number }) {
      try {
        const qs = new URLSearchParams();
        if (params?.q) qs.set('q', params.q);
        if (typeof params?.limit === "number") qs.set('limit', String(params.limit));
        const suffix = qs.toString() ? \`?\${qs.toString()}\` : '';
        return await apiFetch<ApiListResponse<ApiUser>>(\`/api/chat/users\${suffix}\`);
      } catch (error) {
        console.error('Failed to fetch chat users, using fallback:', error);
        return getDevChatUsersFallback();
      }
    }`;

const chatUsersBlockRegex = /async chatUsers\(params\?: \{ q\?: string; limit\?: number \}\) \{[\s\S]*?async messageCreate/;
content = content.replace(chatUsersBlockRegex, newChatUsers + "\n\n    async messageCreate");

fs.writeFileSync(filePath, content);
console.log("Successfully patched src/app/lib/api.ts");

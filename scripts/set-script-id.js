#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const scriptId = process.argv[2] || process.env.SCRIPT_ID;
if (!scriptId) {
  console.error('Error: SCRIPT_ID tidak diberikan.');
  console.error('Penggunaan: node scripts/set-script-id.js <SCRIPT_ID>');
  process.exit(1);
}

const claspJsonPath = path.join(__dirname, '..', '.clasp.json');
const claspConfig = {
  scriptId: scriptId.trim(),
  rootDir: 'src'
};

fs.writeFileSync(claspJsonPath, JSON.stringify(claspConfig, null, 2) + '\n');
console.log(`✅ Berhasil mengupdate .clasp.json dengan Script ID: ${scriptId}`);

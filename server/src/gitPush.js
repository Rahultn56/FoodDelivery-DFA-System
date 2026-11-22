import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve('.');

let remoteUrl = process.argv[2] || process.env.GITHUB_REPO_URL;
const token = process.argv[3] || process.env.GITHUB_TOKEN;

if (!remoteUrl) {
  console.error('Usage: node server/src/gitPush.js <GITHUB_REPO_URL> <GITHUB_TOKEN>');
  process.exit(1);
}

// Ensure .git suffix
if (!remoteUrl.endsWith('.git')) {
  remoteUrl = remoteUrl + '.git';
}

async function push() {
  console.log(`Pushing to ${remoteUrl.replace(/\/\/([^:]+):?([^@]*)@/, '//')} on branch main...`);
  
  // Format authenticated URL if token provided
  let authUrl = remoteUrl;
  if (token && !remoteUrl.includes('@')) {
    authUrl = remoteUrl.replace('https://', `https://${token}@`);
  }

  // Set remote origin
  try {
    await git.addRemote({ fs, dir: rootDir, remote: 'origin', url: authUrl, force: true });
  } catch (e) {
    try {
      await git.deleteRemote({ fs, dir: rootDir, remote: 'origin' });
      await git.addRemote({ fs, dir: rootDir, remote: 'origin', url: authUrl });
    } catch (_) {}
  }

  const pushResult = await git.push({
    fs,
    http,
    dir: rootDir,
    remote: 'origin',
    ref: 'main',
    url: authUrl,
    onAuth: () => ({ username: token || 'token', password: '' }),
    force: true
  });

  console.log('✅ Push complete!');
  console.log('Repository URL:', remoteUrl.replace(/\/\/([^:]+):?([^@]*)@/, '//'));
  console.log('Push details:', JSON.stringify(pushResult, null, 2));
}

push().catch((err) => {
  console.error('❌ Push error:', err.message);
  if (err.data) console.error('Error details:', err.data);
  process.exit(1);
});

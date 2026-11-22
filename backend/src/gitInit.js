import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve('.');

async function cleanAndCommit() {
  console.log('Staging and restructuring Git repository:', rootDir);

  // List old files from client and server to remove from Git index
  const oldFilesToRemove = [
    'client/index.html',
    'client/package.json',
    'client/vite.config.js',
    'client/vercel.json',
    'client/.env.example',
    'client/src/main.jsx',
    'client/src/App.jsx',
    'client/src/api.js',
    'client/src/styles.css',
    'server/package.json',
    'server/.env.example',
    'server/src/index.js',
    'server/src/app.js',
    'server/src/db.js',
    'server/src/seed.js',
    'server/src/socket.js',
    'server/src/gitInit.js',
    'server/src/gitPush.js',
    'server/src/dfa/orderDfa.js',
    'server/src/models/User.js',
    'server/src/models/FoodItem.js',
    'server/src/models/Order.js',
    'server/src/routes/auth.js',
    'server/src/routes/foods.js',
    'server/src/routes/orders.js',
    'server/src/routes/dfa.js',
    'server/src/routes/networkInfo.js',
    'server/src/middleware/auth.js',
    'server/src/middleware/errors.js',
    'server/test/orderDfa.test.js'
  ];

  for (const filepath of oldFilesToRemove) {
    try {
      await git.remove({ fs, dir: rootDir, filepath });
    } catch (_) {}
  }

  const filesToAdd = [
    'package.json',
    'package-lock.json',
    'README.md',
    '.gitignore',
    'vercel.json',
    'api/index.js',
    'frontend/index.html',
    'frontend/package.json',
    'frontend/vite.config.js',
    'frontend/vercel.json',
    'frontend/.env.example',
    'frontend/src/main.jsx',
    'frontend/src/App.jsx',
    'frontend/src/api.js',
    'frontend/src/styles.css',
    'backend/package.json',
    'backend/.env.example',
    'backend/src/index.js',
    'backend/src/app.js',
    'backend/src/db.js',
    'backend/src/seed.js',
    'backend/src/socket.js',
    'backend/src/gitInit.js',
    'backend/src/gitPush.js',
    'backend/src/dfa/orderDfa.js',
    'backend/src/models/User.js',
    'backend/src/models/FoodItem.js',
    'backend/src/models/Order.js',
    'backend/src/routes/auth.js',
    'backend/src/routes/foods.js',
    'backend/src/routes/orders.js',
    'backend/src/routes/dfa.js',
    'backend/src/routes/networkInfo.js',
    'backend/src/middleware/auth.js',
    'backend/src/middleware/errors.js',
    'backend/test/orderDfa.test.js',
    'docs/CN-FLAT-FSWD.md',
    'docs/TESTING.md',
    'docs/screenshots/01_home_menu.png',
    'docs/screenshots/02_cart_drawer.png',
    'docs/screenshots/03_live_tracking.png',
    'docs/screenshots/04_admin_dashboard.png',
    'docs/screenshots/05_dfa_visualizer.png',
    'docs/screenshots/06_network_inspector.png',
    'docs/screenshots/07_client_folder.png',
    'docs/screenshots/08_server_folder.png',
    'docs/screenshots/09_mongodb_database.png',
    'docs/screenshots/10_invalid_transition.png',
    'docs/screenshots/11_github_repo.png'
  ];

  for (const filepath of filesToAdd) {
    if (fs.existsSync(path.join(rootDir, filepath))) {
      await git.add({ fs, dir: rootDir, filepath });
    }
  }

  const sha = await git.commit({
    fs,
    dir: rootDir,
    message: 'Restructure codebase to standard frontend and backend directories',
    author: {
      name: 'Rahul G',
      email: 'rahul.g@example.com'
    }
  });

  console.log('✅ Committed successfully with SHA:', sha);
}

cleanAndCommit().catch(console.error);

import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve('.');

async function stageAndCommit() {
  console.log('Staging files in Git repository:', rootDir);

  const filesToAdd = [
    'package.json',
    'package-lock.json',
    'README.md',
    '.gitignore',
    'vercel.json',
    'api/index.js',
    'FSWD_PROJECT_ASSESSMENT_REPORT.html',
    'FSWD_PROJECT_ASSESSMENT_REPORT.md',
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
    'server/test/orderDfa.test.js',
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
    message: 'Add Vercel deployment configuration, serverless API handler, and fallback resilience',
    author: {
      name: 'Rahul G',
      email: 'rahul.g@example.com'
    }
  });

  console.log('✅ Committed successfully with SHA:', sha);
}

stageAndCommit().catch(console.error);

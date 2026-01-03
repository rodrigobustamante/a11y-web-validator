# Why PNPM?

This project uses **pnpm** (performant npm) as the package manager instead of npm or yarn. Here's why:

## 🚀 Performance Benefits

### Faster Installation
- **Up to 2x faster** than npm
- Uses a **content-addressable store** - packages are stored once globally and hard-linked to projects
- Parallel installation of packages

### Disk Space Efficiency
- **Saves gigabytes** of disk space
- One package version is stored once on disk, linked everywhere
- Example: If you have 10 projects using React 18, it's only stored once

## 🔒 Better Dependency Management

### Strict by Default
- Creates a **non-flat `node_modules`** structure
- Packages can only access dependencies they explicitly declare
- Prevents "phantom dependencies" (accessing packages not in package.json)

### Security
- Ensures you don't accidentally depend on undeclared packages
- Better isolation between packages in a monorepo
- More predictable builds

## 🏗️ Perfect for Monorepos

### Workspace Protocol
- Native monorepo support with `workspace:` protocol
- Share packages between apps efficiently
- Better than npm/yarn workspaces

### Built-in Features
- Filtering commands: `pnpm --filter <package> <command>`
- Recursive commands: `pnpm -r <command>`
- No need for Lerna or other monorepo tools (though we still use Turbo for caching)

## 📊 Comparison

| Feature | PNPM | NPM | Yarn |
|---------|------|-----|------|
| Installation Speed | ⚡⚡⚡ | ⚡ | ⚡⚡ |
| Disk Space Usage | 💾 | 💾💾💾 | 💾💾 |
| Monorepo Support | ✅ Native | ⚠️ Basic | ✅ Native |
| Strict Dependencies | ✅ | ❌ | ❌ |
| Node Modules Structure | Non-flat | Flat | Flat |

## 🔧 Migration from NPM

If you're used to npm, here's the translation:

```bash
# NPM → PNPM
npm install          →  pnpm install
npm install <pkg>    →  pnpm add <pkg>
npm uninstall <pkg>  →  pnpm remove <pkg>
npm run <script>     →  pnpm <script>
npx <command>        →  pnpm dlx <command>
```

## 💡 Tips

### Installing Global Packages
```bash
pnpm add -g <package>
```

### Running Scripts in Specific Workspace
```bash
pnpm --filter @a11y-web-validator/web dev
```

### Update All Dependencies
```bash
pnpm update -r
```

### Check for Outdated Packages
```bash
pnpm outdated
```

## 📚 Resources

- [PNPM Official Docs](https://pnpm.io/)
- [Benchmarks](https://pnpm.io/benchmarks)
- [Workspace Protocol](https://pnpm.io/workspaces)
- [CLI Commands](https://pnpm.io/cli/install)

## 🆚 When NOT to Use PNPM

PNPM is great for most cases, but consider alternatives if:
- Your CI/CD environment doesn't support pnpm (though most do now)
- You're working with very old Node.js versions (< 14)
- Your team is strongly opposed to learning a new tool

However, the migration is usually seamless and the benefits far outweigh the minimal learning curve!


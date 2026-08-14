# Working copies for portfolio import

Do not commit filled briefs or media. The tool and instructions live in [`scripts/import-project/`](../../scripts/import-project/README.md).

```bash
mkdir content/imports/<slug>
cp scripts/import-project/example/brief.yaml content/imports/<slug>/brief.yaml
pnpm import:project -- content/imports/<slug> --dry-run
```


#!/bin/bash
echo "Building simple version without unconscious map..."
export VITE_ENABLE_UNCONSCIOUS_MAP=false
npm run build

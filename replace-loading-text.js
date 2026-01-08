const fs = require('fs');
const path = require('path');

// Files that need to be updated
const filesToUpdate = [
  'app/admin/establishment/page.tsx',
  'app/admin/fees/page.tsx',
  'app/admin/page.tsx',
  'app/admin/products/create/page.tsx',
  'app/admin/products/edit/[id]/page.tsx',
  'app/admin/products/page.tsx',
  'app/admin/promotions/page.tsx',
  'app/admin/users/page.tsx',
  'app/client/market/page.tsx',
  'app/client/orders/[id]/page.tsx',
  'app/client/orders/page.tsx',
  'app/client/page.tsx',
  'app/client/promotions/page.tsx'
];

// Pattern to match loading text
const loadingPatterns = [
  /<p>Carregando\.\.\.<\/p>/g,
  /<p>Carregando categorias\.\.\.<\/p>/g,
  /<p>Carregando dados\.\.\.<\/p>/g,
  /<p>Carregando produtos\.\.\.<\/p>/g,
  /<p>Carregando produto\.\.\.<\/p>/g,
  /<p>Carregando pedidos\.\.\.<\/p>/g,
  /<p>Carregando pedido\.\.\.<\/p>/g,
  /Carregando usuários\.\.\./g
];

// Process each file
filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add LoadingSpinner import if not present
    if (!content.includes('import LoadingSpinner')) {
      // Find the last import line
      const importRegex = /^import.*from.*$/gm;
      let lastImportIndex = 0;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        lastImportIndex = match.index + match[0].length;
      }
      
      // Insert the import after the last import
      const insertPosition = content.indexOf('\n', lastImportIndex) + 1;
      const importStatement = 'import LoadingSpinner from "@/components/ui/loading-spinner";\n';
      content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
    }
    
    // Replace all loading text patterns
    loadingPatterns.forEach(pattern => {
      content = content.replace(pattern, '<LoadingSpinner />');
    });
    
    // Write the updated content back to file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('All files processed!');
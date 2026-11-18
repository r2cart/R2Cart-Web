export const columns=['Product Name','Category','Pack Size','MRP','Selling Price','Stock','Description','Product Group Code','Image URL','Image Filename','Status'];
const keys=['name','category','unit','mrp','price','stock','description','groupCode','image','imageFile','status'];

export const exportColumns=['Product ID','SKU','Product Name','Category','Pack Size','Cost Price','MRP','Selling Price','Stock','Low Stock Alert','Status','Product Group Code','Image URL','Description'];

export const exportColumnsWithoutPrice=['S.No','Product ID','SKU','Product Name','Category','Pack Size / Unit','Stock Quantity','Stock Status','Status','Product Group Code','Description'];

const download=(bytes,name,type)=>{const url=URL.createObjectURL(new Blob([bytes],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
async function workbook(){const module=await import('exceljs');return new module.default.Workbook()}

export async function downloadTemplate(categories){
 const book=await workbook(),sheet=book.addWorksheet('Products');sheet.addRow(columns);
 const category=categories.find(item=>item.status!=='INACTIVE')?.slug||'dairy-breakfast';
 sheet.addRow(['Example Milk',category,'500 ml',32,30,20,'Fresh milk for daily needs.','MILK-001','https://example.com/milk.png','','ACTIVE']);
 sheet.addRow(['Example Milk',category,'1 L',64,60,10,'Fresh milk for daily needs.','MILK-001','https://example.com/milk.png','','ACTIVE']);
 sheet.columns.forEach(column=>column.width=22);sheet.getRow(1).font={bold:true};sheet.views=[{state:'frozen',ySplit:1}];
 const help=book.addWorksheet('Instructions');[
  'Replace the example rows with your actual products. Maximum 200 rows.',
  'Use an existing category name or slug from the Categories sheet.',
  'Each pack is a separate row. Use the same Product Group Code for sizes of the same product.',
  'MRP and Selling Price must be positive; Selling Price cannot exceed MRP. Stock is a whole number.',
  'Use Image URL OR Image Filename. ZIP image filenames must match exactly (JPG, PNG, WebP).',
  'SKU is generated automatically. Existing name + category + pack combinations are rejected.',
  'Status: ACTIVE or INACTIVE. Import creates new listings; existing packs can be edited separately.'
 ].forEach(text=>help.addRow([text]));help.getColumn(1).width=115;
 const cats=book.addWorksheet('Categories');cats.addRow(['Category Name','Category Slug']);categories.filter(cat=>cat.status!=='INACTIVE').forEach(cat=>cats.addRow([cat.name,cat.slug]));cats.columns.forEach(column=>column.width=35);
 download(await book.xlsx.writeBuffer(),'R2Cart-products-template.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function downloadProductsExcel(products, categories, categoryFilter='all'){
 const book=await workbook(),sheet=book.addWorksheet('Products');
 sheet.addRow(exportColumns);

 // Header styling
 const headerRow=sheet.getRow(1);
 headerRow.height=26;
 headerRow.font={bold:true,color:{argb:'FFFFFFFF'},size:11};
 headerRow.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF059669'}};
 headerRow.alignment={vertical:'middle',horizontal:'center'};

 products.forEach(p=>{
  sheet.addRow([
   p.id||'',
   p.sku||'',
   p.name||'',
   p.categorySlug||p.categoryName||p.category||'',
   p.unit||'',
   Number(p.costPrice||0),
   Number(p.mrp||0),
   Number(p.price||0),
   Number(p.stock||0),
   Number(p.lowStockThreshold||10),
   p.status||'ACTIVE',
   p.groupCode||p.variantGroupId||'',
   p.image||'',
   p.description||''
  ]);
 });

 sheet.columns=[
  {width:18}, // Product ID
  {width:18}, // SKU
  {width:28}, // Product Name
  {width:22}, // Category
  {width:14}, // Pack Size
  {width:14,style:{numFmt:'₹#,##0.00'}}, // Cost Price
  {width:14,style:{numFmt:'₹#,##0.00'}}, // MRP
  {width:14,style:{numFmt:'₹#,##0.00'}}, // Selling Price
  {width:12,style:{numFmt:'#,##0'}},    // Stock
  {width:14,style:{numFmt:'#,##0'}},    // Low Stock Alert
  {width:12}, // Status
  {width:18}, // Group Code
  {width:30}, // Image URL
  {width:36}  // Description
 ];

 sheet.views=[{state:'frozen',ySplit:1}];

 const help=book.addWorksheet('Instructions');
 [
  'BULK EDIT & PRICING INSTRUCTIONS:',
  '1. Edit Cost Price, MRP, Selling Price, Stock or Status directly in the Products sheet.',
  '2. Do NOT change the "Product ID" or "SKU" column for existing products — system uses them to match each product.',
  '3. Selling Price must be less than or equal to MRP. Cost Price is your real purchase rate.',
  '4. You can also add NEW products at the bottom: leave Product ID and SKU blank for new rows.',
  '5. Save this Excel file and re-upload on the Bulk Management page to apply changes instantly.'
 ].forEach(text=>help.addRow([text]));
 help.getColumn(1).width=100;
 help.getRow(1).font={bold:true,size:12,color:{argb:'FF059669'}};

 if(Array.isArray(categories)&&categories.length){
  const cats=book.addWorksheet('Categories');
  cats.addRow(['Category Name','Category Slug']);
  cats.getRow(1).font={bold:true};
  categories.filter(cat=>cat.status!=='INACTIVE').forEach(cat=>cats.addRow([cat.name,cat.slug]));
  cats.columns.forEach(column=>column.width=30);
 }

 const filename=`R2Cart-products-${categoryFilter||'all'}-${new Date().toISOString().slice(0,10)}.xlsx`;
 download(await book.xlsx.writeBuffer(),filename,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/**
 * 1-Click download of listed products in PDF format.
 * - Grouped by Category
 * - Only Product Name and Unit / Pack Size (NO prices)
 */
export async function downloadProductsCategoryPdfWithoutPrice(products, categories, categoryFilter = 'all') {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Group products by category
  const catMap = new Map();

  // Seed categories from categories array to preserve order
  if (Array.isArray(categories)) {
    categories.forEach(c => {
      catMap.set(c.slug, {
        name: c.name || c.slug,
        slug: c.slug,
        items: []
      });
    });
  }

  // Populate products into category buckets
  products.forEach(p => {
    const slug = p.categorySlug || p.category || 'other';
    const catName = p.categoryName || (catMap.get(slug)?.name) || slug || 'General Products';
    if (!catMap.has(slug)) {
      catMap.set(slug, {
        name: catName,
        slug,
        items: []
      });
    }
    catMap.get(slug).items.push({
      name: String(p.name || '').trim(),
      unit: String(p.unit || '').trim() || '1 unit'
    });
  });

  // Filter out empty categories and sort alphabetically
  const activeCategories = Array.from(catMap.values())
    .filter(c => c.items.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Sort products within each category alphabetically
  activeCategories.forEach(c => {
    c.items.sort((a, b) => a.name.localeCompare(b.name));
  });

  const totalProducts = activeCategories.reduce((sum, c) => sum + c.items.length, 0);

  // 2. Draw Top Document Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('R2Cart', 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('Listed Products Catalogue (Category-wise)', 42, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const genDateStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  doc.text(`Generated: ${genDateStr}  ·  Categories: ${activeCategories.length}  ·  Total Products: ${totalProducts}  ·  Product Name & Unit Only (No Price)`, 14, 25);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 28, pageWidth - 14, 28);

  let currentY = 34;

  // 3. Render Each Category and its Products
  activeCategories.forEach((cat) => {
    // If not enough room for category banner and at least a few rows, start new page
    if (currentY + 28 > pageHeight - 16) {
      doc.addPage();
      currentY = 16;
    }

    // Category heading banner
    doc.setFillColor(240, 253, 244); // #f0fdf4
    doc.setDrawColor(167, 243, 208); // #a7f3d0
    doc.roundedRect(14, currentY, pageWidth - 28, 8, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(4, 120, 87); // #047857
    doc.text(`${cat.name}  (${cat.items.length} items)`, 17, currentY + 5.5);

    currentY += 10;

    autoTable(doc, {
      head: [['#', 'Product Name', 'Unit / Pack Size']],
      body: cat.items.map((it, i) => [
        i + 1,
        it.name,
        it.unit
      ]),
      startY: currentY,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
        cellPadding: 2.2
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
        cellPadding: 2.2
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'left', cellWidth: 130 },
        2: { halign: 'center', cellWidth: 40, fontStyle: 'bold' }
      }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  });

  // 4. Global Footer on All Pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('R2Cart Store Directory  ·  Confidential Inventory Listing  ·  Product Name & Unit Only', 14, pageHeight - 8);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  const dateSlug = new Date().toISOString().slice(0, 10);
  const safeCat = (!categoryFilter || categoryFilter === 'all') ? 'All-Categories' : categoryFilter.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `R2Cart-products-by-category-${safeCat}-${dateSlug}.pdf`;

  doc.save(filename);
}

/**
 * 1-Click download of listed products WITHOUT any price, cost, or MRP columns.
 * Produces a professionally formatted Excel spreadsheet (.xlsx).
 */
export async function downloadProductsListWithoutPrice(products, categories, categoryFilter = 'all') {
  const book = await workbook();
  const sheet = book.addWorksheet('Listed Products');
  sheet.addRow(exportColumnsWithoutPrice);

  // Header styling: Emerald green header, bold white text
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  products.forEach((p, index) => {
    const stockQty = Number(p.stock || 0);
    const lowThreshold = Number(p.lowStockThreshold || 10);
    const stockStatus = stockQty <= 0 ? 'Sold Out' : stockQty <= lowThreshold ? 'Low Stock' : 'In Stock';
    const statusLabel = p.status === 'INACTIVE' ? 'Inactive' : 'Active';

    let catName = p.categoryName || '';
    if (!catName && categories && Array.isArray(categories)) {
      const match = categories.find(c => c.slug === p.categorySlug || c.slug === p.category || c.id === p.categoryId);
      if (match) catName = match.name;
    }
    if (!catName) catName = p.categorySlug || p.category || '';

    const row = sheet.addRow([
      index + 1,
      p.id || '',
      p.sku || '',
      p.name || '',
      catName,
      p.unit || '',
      stockQty,
      stockStatus,
      statusLabel,
      p.groupCode || p.variantGroupId || '',
      p.description || ''
    ]);

    row.height = 22;
    row.alignment = { vertical: 'middle' };

    // Center alignment for specific columns
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };

    // Color code stock status
    if (stockQty <= 0) {
      row.getCell(8).font = { color: { argb: 'FFDC2626' }, bold: true };
    } else if (stockQty <= lowThreshold) {
      row.getCell(8).font = { color: { argb: 'FFD97706' }, bold: true };
    } else {
      row.getCell(8).font = { color: { argb: 'FF16A34A' }, bold: true };
    }

    if (p.status === 'INACTIVE') {
      row.getCell(9).font = { color: { argb: 'FF94A3B8' } };
    }
  });

  sheet.columns = [
    { width: 8 },  // S.No
    { width: 18 }, // Product ID
    { width: 18 }, // SKU
    { width: 34 }, // Product Name
    { width: 24 }, // Category
    { width: 16 }, // Pack Size
    { width: 16, style: { numFmt: '#,##0' } }, // Stock Quantity
    { width: 16 }, // Stock Status
    { width: 14 }, // Status
    { width: 20 }, // Product Group Code
    { width: 45 }  // Description
  ];

  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Summary worksheet
  const summarySheet = book.addWorksheet('Summary');
  summarySheet.addRow(['R2Cart - Listed Products (Catalogue Without Price)']);
  summarySheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF059669' } };
  summarySheet.addRow([]);
  summarySheet.addRow(['Generated Date:', new Date().toLocaleString('en-IN')]);
  summarySheet.addRow(['Total Products Listed:', products.length]);
  summarySheet.addRow(['Category Scope:', categoryFilter === 'all' || !categoryFilter ? 'All Categories' : categoryFilter]);
  summarySheet.addRow(['Notice:', 'Confidential catalogue & inventory list without commercial pricing details.']);
  summarySheet.columns = [{ width: 25 }, { width: 55 }];

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeCat = (!categoryFilter || categoryFilter === 'all') ? 'All' : categoryFilter.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `R2Cart-products-without-price-${safeCat}-${dateStr}.xlsx`;

  download(
    await book.xlsx.writeBuffer(),
    filename,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

/**
 * 1-Click download of listed products WITHOUT price in CSV format.
 */
export function downloadProductsCsvWithoutPrice(products, categories, categoryFilter = 'all') {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = [
    exportColumnsWithoutPrice.map(escapeCsv).join(',')
  ];

  products.forEach((p, index) => {
    const stockQty = Number(p.stock || 0);
    const lowThreshold = Number(p.lowStockThreshold || 10);
    const stockStatus = stockQty <= 0 ? 'Sold Out' : stockQty <= lowThreshold ? 'Low Stock' : 'In Stock';
    const statusLabel = p.status === 'INACTIVE' ? 'Inactive' : 'Active';

    let catName = p.categoryName || '';
    if (!catName && categories && Array.isArray(categories)) {
      const match = categories.find(c => c.slug === p.categorySlug || c.slug === p.category || c.id === p.categoryId);
      if (match) catName = match.name;
    }
    if (!catName) catName = p.categorySlug || p.category || '';

    const row = [
      index + 1,
      p.id || '',
      p.sku || '',
      p.name || '',
      catName,
      p.unit || '',
      stockQty,
      stockStatus,
      statusLabel,
      p.groupCode || p.variantGroupId || '',
      p.description || ''
    ];

    lines.push(row.map(escapeCsv).join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeCat = (!categoryFilter || categoryFilter === 'all') ? 'All' : categoryFilter.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `R2Cart-products-without-price-${safeCat}-${dateStr}.csv`;

  download(new TextEncoder().encode(csvContent), filename, 'text/csv;charset=utf-8;');
}

export function parseCsv(text){
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(value);value=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value=''}else value+=c}
 if(quoted)throw new Error('CSV contains an unclosed quotation mark');if(value||row.length){row.push(value);rows.push(row)}return rows;
}

export async function readProductFile(file){
 if(file.size>10*1024*1024)throw new Error('Spreadsheet must be smaller than 10 MB');let table;
 if(/\.csv$/i.test(file.name))table=parseCsv((await file.text()).replace(/^\uFEFF/,''));
 else if(/\.xlsx$/i.test(file.name)){
  const book=await workbook();
  await book.xlsx.load(await file.arrayBuffer());
  const sheet=book.getWorksheet('Products')||book.worksheets[0];
  if(!sheet)throw new Error('Workbook has no product sheet');
  if(sheet.rowCount>501)throw new Error('Maximum 500 product rows per batch');
  table=[];
  const maxCols=Math.max(sheet.columnCount||0,14);
  sheet.eachRow({includeEmpty:true},row=>{
   const rowValues=[];
   for(let i=1;i<=maxCols;i++){
    const cell=row.getCell(i);
    if(cell.formula)throw new Error('Use plain values, not spreadsheet formulas');
    rowValues.push(cell.text!=null?String(cell.text):'');
   }
   table.push(rowValues);
  });
 }
 else throw new Error('Choose an .xlsx or .csv file');

 const headerRow=table.shift();
 if(!headerRow)throw new Error('Use the template column headers, including optional columns');
 const headers=headerRow.map(value=>String(value).trim().toLowerCase());

 // Check headers: either template columns OR export columns must be present
 const hasTemplateHeaders=columns.every(col=>headers.includes(col.toLowerCase()));
 const hasExportHeaders=['product name','category','pack size','mrp','selling price'].every(h=>headers.includes(h));

 if(!hasTemplateHeaders&&!hasExportHeaders){
  throw new Error('Use the template column headers, including optional columns');
 }

 const getVal=(row,colNames)=>{
  for(const name of colNames){
   const idx=headers.indexOf(name.toLowerCase());
   if(idx!==-1&&row[idx]!==undefined)return String(row[idx]).trim();
  }
  return '';
 };

 const rows=table.filter(row=>row.some(value=>String(value).trim())).map(row=>({
  id:getVal(row,['Product ID','id']),
  sku:getVal(row,['SKU','sku']),
  name:getVal(row,['Product Name','name']),
  category:getVal(row,['Category','category','Category Slug','Category Name']),
  unit:getVal(row,['Pack Size','unit','pack']),
  costPrice:getVal(row,['Cost Price','costPrice','Purchase Price','Real Rate']),
  mrp:getVal(row,['MRP','mrp']),
  price:getVal(row,['Selling Price','price','Selling price']),
  stock:getVal(row,['Stock','stock','Quantity']),
  lowStockThreshold:getVal(row,['Low Stock Alert','lowStockThreshold','Threshold']),
  description:getVal(row,['Description','description']),
  groupCode:getVal(row,['Product Group Code','groupCode','Group Code']),
  image:getVal(row,['Image URL','image']),
  imageFile:getVal(row,['Image Filename','imageFile']),
  status:getVal(row,['Status','status'])||'ACTIVE'
 }));

 if(!rows.length||rows.length>500)throw new Error('Upload between 1 and 500 product rows');
 return rows;
}

export async function readImageZip(file){
 if(!/\.zip$/i.test(file.name)||file.size>30*1024*1024)throw new Error('Choose an image ZIP smaller than 30 MB');
 const {unzipSync}=await import('fflate'),bytes=new Uint8Array(await file.arrayBuffer());let total=0,count=0;
 const allowed=entry=>/\.(jpe?g|png|webp)$/i.test(entry.name)&&!entry.name.startsWith('__MACOSX/')&&!entry.name.split('/').some(part=>part==='..');
 unzipSync(bytes,{filter:entry=>{if(allowed(entry)){total+=entry.originalSize;count++;if(entry.originalSize>5*1024*1024||total>50*1024*1024||count>200)throw new Error('ZIP limit: 200 images, 5 MB each, 50 MB total')}return false}});
 const images={};for(const [path,data] of Object.entries(unzipSync(bytes,{filter:allowed}))){const name=path.split('/').pop();if(images[name])throw new Error(`Duplicate ZIP filename: ${name}`);const type=/\.png$/i.test(name)?'image/png':/\.webp$/i.test(name)?'image/webp':'image/jpeg';images[name]=new File([data],name,{type})}if(!Object.keys(images).length)throw new Error('ZIP contains no JPG, PNG or WebP images');return images;
}

export function downloadErrors(rows){
 const escape=value=>`"${String(value).replaceAll('"','""')}"`;
 download(['Row,Product,Errors',...rows.filter(row=>!row.valid).map(row=>[row.rowNumber,row.data?.name||'',row.errors.join('; ')].map(escape).join(','))].join('\r\n'),'R2Cart-import-errors.csv','text/csv;charset=utf-8');
}

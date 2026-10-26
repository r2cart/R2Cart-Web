export const columns=['Product Name','Category','Pack Size','MRP','Selling Price','Stock','Description','Product Group Code','Image URL','Image Filename','Status'];
const keys=['name','category','unit','mrp','price','stock','description','groupCode','image','imageFile','status'];

export const exportColumns=['Product ID','SKU','Product Name','Category','Pack Size','Cost Price','MRP','Selling Price','Stock','Low Stock Alert','Status','Product Group Code','Image URL','Description'];

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

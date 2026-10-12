export const columns=['Product Name','Category','Pack Size','MRP','Selling Price','Stock','Description','Product Group Code','Image URL','Image Filename','Status'];
const keys=['name','category','unit','mrp','price','stock','description','groupCode','image','imageFile','status'];
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
export function parseCsv(text){
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(value);value=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value=''}else value+=c}
 if(quoted)throw new Error('CSV contains an unclosed quotation mark');if(value||row.length){row.push(value);rows.push(row)}return rows;
}
export async function readProductFile(file){
 if(file.size>5*1024*1024)throw new Error('Spreadsheet must be smaller than 5 MB');let table;
 if(/\.csv$/i.test(file.name))table=parseCsv((await file.text()).replace(/^\uFEFF/,''));
 else if(/\.xlsx$/i.test(file.name)){const book=await workbook();await book.xlsx.load(await file.arrayBuffer());const sheet=book.getWorksheet('Products')||book.worksheets[0];if(!sheet)throw new Error('Workbook has no product sheet');if(sheet.rowCount>201)throw new Error('Maximum 200 product rows per import');table=[];sheet.eachRow({includeEmpty:true},row=>{table.push(columns.map((_,i)=>{const cell=row.getCell(i+1);if(cell.formula)throw new Error('Use plain values, not spreadsheet formulas');return cell.text}))})}
 else throw new Error('Choose an .xlsx or .csv file');
 const headers=table.shift()?.map(value=>String(value).trim().toLowerCase());if(!headers||columns.some(column=>!headers.includes(column.toLowerCase())))throw new Error('Use the template column headers, including optional columns');
 const rows=table.filter(row=>row.some(value=>String(value).trim())).map(row=>Object.fromEntries(keys.map((key,i)=>[key,String(row[headers.indexOf(columns[i].toLowerCase())]??'').trim()])));
 if(!rows.length||rows.length>200)throw new Error('Upload between 1 and 200 product rows');return rows;
}
export async function readImageZip(file){
 if(!/\.zip$/i.test(file.name)||file.size>30*1024*1024)throw new Error('Choose an image ZIP smaller than 30 MB');
 const {unzipSync}=await import('fflate'),bytes=new Uint8Array(await file.arrayBuffer());let total=0,count=0;
 const allowed=entry=>/\.(jpe?g|png|webp)$/i.test(entry.name)&&!entry.name.startsWith('__MACOSX/')&&!entry.name.split('/').some(part=>part==='..');
 unzipSync(bytes,{filter:entry=>{if(allowed(entry)){total+=entry.originalSize;count++;if(entry.originalSize>5*1024*1024||total>50*1024*1024||count>200)throw new Error('ZIP limit: 200 images, 5 MB each, 50 MB total')}return false}});
 const images={};for(const [path,data] of Object.entries(unzipSync(bytes,{filter:allowed}))){const name=path.split('/').pop();if(images[name])throw new Error(`Duplicate ZIP filename: ${name}`);const type=/\.png$/i.test(name)?'image/png':/\.webp$/i.test(name)?'image/webp':'image/jpeg';images[name]=new File([data],name,{type})}if(!Object.keys(images).length)throw new Error('ZIP contains no JPG, PNG or WebP images');return images;
}
export function downloadErrors(rows){const escape=value=>`"${String(value).replaceAll('"','""')}"`;download(['Row,Errors',...rows.filter(row=>!row.valid).map(row=>[row.rowNumber,row.errors.join('; ')].map(escape).join(','))].join('\r\n'),'R2Cart-import-errors.csv','text/csv;charset=utf-8')}

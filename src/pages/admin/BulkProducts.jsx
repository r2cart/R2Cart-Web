import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,Download,Upload,CheckCircle2,FileSpreadsheet,Layers,RefreshCw,AlertCircle,Filter,Sparkles,Check,Edit3,PlusCircle} from 'lucide-react';
import {Button,money} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import {downloadTemplate,downloadProductsExcel,readProductFile,readImageZip,downloadErrors} from '../../services/product-import.service';
import useAdminCategories from '../../hooks/useAdminCategories';

export default function BulkProducts(){
 const {notify,refreshProducts}=useApp();
 const {categories,categoryError,reloadCategories}=useAdminCategories();
 
 const [selectedCat,setSelectedCat]=useState('all');
 const [exporting,setExporting]=useState(false);
 const [categoryStats,setCategoryStats]=useState({all:0});

 const [rows,setRows]=useState([]);
 const [preview,setPreview]=useState([]);
 const [images,setImages]=useState({});
 const [filename,setFilename]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [success,setSuccess]=useState(null);

 // Fetch product counts per category for display in the export selector
 useEffect(()=>{
  let mounted=true;
  adminService.exportProducts('all').then(res=>{
   if(!mounted||!res?.products)return;
   const counts={all:res.products.length};
   res.products.forEach(p=>{
    const slug=p.categorySlug||p.category;
    if(slug)counts[slug]=(counts[slug]||0)+1;
   });
   setCategoryStats(counts);
  }).catch(()=>{});
  return()=>{mounted=false};
 },[]);

 const handleExportExcel=async()=>{
  setExporting(true);
  setError('');
  try{
   const res=await adminService.exportProducts(selectedCat==='all'?'':selectedCat);
   const prods=res?.products||[];
   if(!prods.length){
    throw new Error(`No products found in ${selectedCat==='all'?'the store':selectedCat} to export.`);
   }
   await downloadProductsExcel(prods,categories,selectedCat);
   notify(`Exported ${prods.length} products to Excel sheet successfully!`);
  }catch(reason){
   setError(reason.message||'Failed to export products.');
  }finally{
   setExporting(false);
  }
 };

 const check=async(values,files=images)=>{
  const result=await adminService.previewProductImport(values);
  const checked=result.map(row=>{
   const errors=[...row.errors];
   if(row.data.imageFile&&!files[row.data.imageFile]&&row.data.action==='CREATE'){
    errors.push(`ZIP image missing: ${row.data.imageFile}`);
   }
   return {...row,errors,valid:errors.length===0};
  });
  setPreview(checked);
  return checked;
 };

 const fileChange=async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  setBusy(true);
  setError('');
  setSuccess(null);
  setPreview([]);
  setRows([]);
  try{
   const values=await readProductFile(file);
   setRows(values);
   setFilename(file.name);
   await check(values);
   notify(`Loaded ${values.length} rows from ${file.name}`);
  }catch(reason){
   setError(reason.message);
  }finally{
   setBusy(false);
   event.target.value='';
  }
 };

 const zipChange=async event=>{
  const input=event.target,file=input.files?.[0];
  if(!file)return;
  setBusy(true);
  setError('');
  try{
   const files=await readImageZip(file);
   setImages(files);
   if(rows.length)await check(rows,files);
   notify(`${Object.keys(files).length} ZIP images ready`);
  }catch(reason){
   setError(reason.message);
  }finally{
   setBusy(false);
   input.value='';
  }
 };

 const recheck=async()=>{
  setBusy(true);
  setError('');
  try{
   await check(rows);
  }catch(reason){
   setError(reason.message);
  }finally{
   setBusy(false);
  }
 };

 const removeInvalid=async()=>{
  const valid=preview.filter(row=>row.valid).map(row=>rows[row.rowNumber-2]);
  setRows(valid);
  setPreview([]);
  if(valid.length){
   setBusy(true);
   try{
    await check(valid);
   }catch(reason){
    setError(reason.message);
   }finally{
    setBusy(false);
   }
  }
 };

 const applyAll=async()=>{
  setBusy(true);
  setError('');
  setMessage('Validating all spreadsheet rows…');
  let values=rows;
  try{
   const checked=await check(values);
   if(checked.some(row=>!row.valid)){
    throw new Error('Resolve invalid rows or remove them before applying changes');
   }
   const uploaded=new Map();
   values=values.map(row=>({...row}));
   for(let i=0;i<values.length;i++){
    const row=values[i];
    if(!row.imageFile||row.action==='UPDATE')continue;
    const key=`${checked[i].data.category}|${row.imageFile}`;
    setMessage(`Uploading images · row ${i+1} of ${values.length}`);
    if(!uploaded.has(key)){
     uploaded.set(key,(await adminService.uploadProductImage(images[row.imageFile],checked[i].data.category)).url);
    }
    row.image=uploaded.get(key);
    row.imageFile='';
    setRows(values.map(value=>({...value})));
   }
   setMessage('Updating database & applying new prices…');
   const result=await adminService.importProducts(values);
   setSuccess(result);
   setRows([]);
   setPreview([]);
   await refreshProducts();
   window.dispatchEvent(new Event('grocify:products-updated'));
   notify(`Bulk update completed: ${result.updated||0} updated, ${result.created||0} created!`);
  }catch(reason){
   setError(reason.message);
   if(values.length)await check(values).catch(()=>{});
  }finally{
   setBusy(false);
   setMessage('');
  }
 };

 const validCount=preview.filter(row=>row.valid).length;
 const invalidCount=preview.length-validCount;
 const updateCount=preview.filter(row=>row.valid&&row.data.action==='UPDATE').length;
 const createCount=preview.filter(row=>row.valid&&row.data.action==='CREATE').length;

 return (
  <>
   <Link className="back-link" to="/admin/products"><ArrowLeft size={16}/> Back to products</Link>
   <div className="admin-title">
    <div>
     <h1>Excel Bulk Pricing & Product Management</h1>
     <p>Download complete product sheets, update prices & stock in Excel, and re-upload to update all products at once.</p>
    </div>
   </div>

   {/* Top Export Section */}
   <section className="admin-card" style={{border:'1px solid #bbf7d0',background:'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',marginBottom:'20px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px'}}>
     <div style={{maxWidth:'600px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
       <FileSpreadsheet size={22} color="#059669"/>
       <h3 style={{margin:0,fontSize:'16px',fontWeight:800,color:'#0f172a'}}>1. Download Products Excel Sheet</h3>
      </div>
      <p style={{margin:0,fontSize:'13px',color:'#475569',lineHeight:1.5}}>
       Download an Excel file of all categories or select a specific category. Open in Excel/Google Sheets, change <b>Cost Price</b> (real rate), <b>MRP</b>, <b>Selling Price</b>, or <b>Stock</b>, then re-upload below.
      </p>
     </div>

     {/* Category Filter and Download Actions */}
     <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
       <label style={{fontSize:'11.5px',fontWeight:700,color:'#334155'}}>Select Category to Download:</label>
       <select
        value={selectedCat}
        onChange={e=>setSelectedCat(e.target.value)}
        disabled={exporting}
        style={{
         padding:'8px 12px',
         borderRadius:'8px',
         border:'1px solid #cbd5e1',
         fontSize:'13px',
         fontWeight:600,
         background:'#ffffff',
         color:'#0f172a',
         minWidth:'240px'
        }}
       >
        <option value="all">📁 All Categories (Total: {categoryStats.all||0} products)</option>
        {categories.map(c=>(
         <option key={c.slug} value={c.slug}>
          {c.name} ({categoryStats[c.slug]||0} products)
         </option>
        ))}
       </select>
      </div>

      <div style={{marginTop:'18px',display:'flex',gap:'8px'}}>
       <Button
        variant="primary"
        disabled={exporting||busy}
        onClick={handleExportExcel}
        style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'9px 18px',fontWeight:700}}
       >
        <Download size={17}/> {exporting ? 'Preparing Sheet…' : `Download Excel Sheet (${categoryStats[selectedCat]!==undefined?categoryStats[selectedCat]:'All'})`}
       </Button>

       <Button
        variant="outline"
        disabled={busy}
        onClick={async()=>{
         try{await downloadTemplate(categories);notify('Downloaded blank template.');}
         catch(r){setError(r.message);}
        }}
        title="Download empty template if adding brand new products from scratch"
        style={{fontSize:'12px',padding:'9px 14px'}}
       >
        Blank Template
       </Button>
      </div>
     </div>
    </div>
   </section>

   {/* Upload Section */}
   <section className="admin-card bulk-guide" style={{marginBottom:'20px'}}>
    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
     <Upload size={20} color="#059669"/>
     <h3 style={{margin:0,fontSize:'16px',fontWeight:800,color:'#0f172a'}}>2. Upload Modified Excel Sheet</h3>
    </div>
    <p style={{fontSize:'13px',color:'#475569',marginBottom:'14px',lineHeight:1.5}}>
     Select your updated <b>.xlsx</b> or <b>.csv</b> file. The system will automatically detect existing products (by Product ID / SKU) and update their prices, costs, and stocks atomically in MySQL.
    </p>

    <div className="bulk-upload-actions" style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
     <label className={`btn btn-primary ${busy?'bulk-disabled':''}`} style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 18px'}}>
      <Upload size={18}/> Upload Edited Excel / CSV
      <input hidden disabled={busy} type="file" accept=".xlsx,.csv" onChange={fileChange}/>
     </label>

     <label className={`btn btn-outline ${busy?'bulk-disabled':''}`} style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 14px',fontSize:'12.5px'}}>
      <Upload size={16}/> Upload New Images ZIP (Optional)
      <input hidden disabled={busy} type="file" accept=".zip" onChange={zipChange}/>
     </label>

     <span className="muted" style={{fontSize:'12.5px',fontWeight:600}}>
      {filename ? `📄 ${filename}` : 'No file selected'} · {Object.keys(images).length} ZIP images
     </span>
    </div>
   </section>

   {categoryError&&<div className="admin-card bulk-error" role="alert">{categoryError}<Button variant="outline" onClick={reloadCategories}>Retry categories</Button></div>}
   {error&&<div className="admin-card bulk-error" role="alert" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c',padding:'12px 16px',borderRadius:'10px',marginBottom:'16px',fontWeight:600}}><AlertCircle size={18}/> {error}</div>}
   {busy&&<div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',padding:'14px 18px',borderRadius:'12px',color:'#065f46',fontWeight:700,display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}><RefreshCw size={18} className="animate-spin"/> {message||'Processing spreadsheet…'}</div>}

   {/* Success Message */}
   {success&&(
    <section className="admin-card bulk-success" style={{background:'#f0fdf4',border:'1px solid #86efac',padding:'20px',borderRadius:'14px',marginBottom:'20px',textAlign:'center'}}>
     <CheckCircle2 size={42} color="#16a34a" style={{margin:'0 auto 10px'}}/>
     <h3 style={{fontSize:'18px',fontWeight:800,color:'#14532d',margin:'0 0 6px'}}>
      Bulk Operations Completed Successfully! 🎉
     </h3>
     <p style={{fontSize:'13.5px',color:'#166534',margin:'0 0 16px'}}>
      <b>{success.updated||0}</b> products updated · <b>{success.created||0}</b> new products created in database and published to the live catalogue.
     </p>
     <Link className="btn btn-primary" to="/admin/products" style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'9px 20px'}}>
      View Products Catalogue
     </Link>
    </section>
   )}

   {/* Preview Table */}
   {!!preview.length&&(
    <section className="admin-card table-card" style={{border:'1px solid #e2e8f0',borderRadius:'14px',overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>
     {/* Preview Header & Stat Chips */}
     <div className="bulk-preview-head" style={{padding:'16px 20px',background:'#ffffff',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
      <div>
       <h3 style={{margin:0,fontSize:'16px',fontWeight:800,color:'#0f172a'}}>3. Review Changes Before Applying</h3>
       <div style={{display:'flex',gap:'8px',marginTop:'6px',flexWrap:'wrap'}}>
        <span style={{fontSize:'11.5px',fontWeight:700,padding:'2px 8px',borderRadius:'6px',background:'#ecfdf5',color:'#059669',border:'1px solid #a7f3d0'}}>
         ✓ {validCount} Ready to Apply
        </span>
        {updateCount > 0 && (
         <span style={{fontSize:'11.5px',fontWeight:700,padding:'2px 8px',borderRadius:'6px',background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe'}}>
          ✏️ {updateCount} Updates
         </span>
        )}
        {createCount > 0 && (
         <span style={{fontSize:'11.5px',fontWeight:700,padding:'2px 8px',borderRadius:'6px',background:'#f5f3ff',color:'#7c3aed',border:'1px solid #ddd6fe'}}>
          ✨ {createCount} New Additions
         </span>
        )}
        {invalidCount > 0 && (
         <span style={{fontSize:'11.5px',fontWeight:700,padding:'2px 8px',borderRadius:'6px',background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca'}}>
          ⚠️ {invalidCount} Needs Attention
         </span>
        )}
       </div>
      </div>

      <div className="bulk-upload-actions" style={{display:'flex',gap:'8px'}}>
       <Button variant="outline" disabled={busy} onClick={recheck} style={{fontSize:'12px',padding:'6px 12px'}}>
        <RefreshCw size={13}/> Recheck
       </Button>
       {invalidCount > 0 && (
        <>
         <Button variant="ghost" disabled={busy} onClick={()=>downloadErrors(preview)} style={{fontSize:'12px',padding:'6px 12px',color:'#dc2626'}}>
          Download Errors CSV
         </Button>
         <Button variant="ghost" disabled={busy||validCount===0} onClick={removeInvalid} style={{fontSize:'12px',padding:'6px 12px'}}>
          Remove Invalid Rows
         </Button>
        </>
       )}
      </div>
     </div>

     {/* Table View */}
     <div className="table-wrap" style={{maxHeight:'600px',overflowY:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
       <thead style={{position:'sticky',top:0,background:'#f8fafc',zIndex:2}}>
        <tr>
         {['Row','Action','Product & Pack','Category','Cost Price (Real)','MRP','Selling Price','Stock','Status','Validation'].map(label=>(
          <th key={label} style={{padding:'10px 14px',fontSize:'12px',fontWeight:700,color:'#475569',textAlign:'left',borderBottom:'1px solid #e2e8f0',whiteSpace:'nowrap'}}>
           {label}
          </th>
         ))}
        </tr>
       </thead>
       <tbody>
        {preview.map(row=>{
         const d=row.data;
         const isUpdate=d.action==='UPDATE';
         const curr=d.currentValues;
         
         const costChanged=curr&&Number(curr.costPrice)!==Number(d.costPrice);
         const priceChanged=curr&&Number(curr.price)!==Number(d.price);
         const mrpChanged=curr&&Number(curr.mrp)!==Number(d.mrp);
         const stockChanged=curr&&Number(curr.stock)!==Number(d.stock);

         return (
          <tr key={row.rowNumber} className={row.valid?'':'bulk-invalid-row'} style={{borderBottom:'1px solid #f1f5f9',background:row.valid?(isUpdate?'#ffffff':'#fdf4ff'):'#fff1f2'}}>
           <td style={{padding:'10px 14px',fontSize:'12px',color:'#64748b',fontWeight:600}}>{row.rowNumber}</td>
           <td style={{padding:'10px 14px',whiteSpace:'nowrap'}}>
            {isUpdate ? (
             <span style={{fontSize:'10.5px',fontWeight:800,padding:'2px 7px',borderRadius:'4px',background:'#dbeafe',color:'#1d4ed8'}}>
              UPDATE
             </span>
            ) : (
             <span style={{fontSize:'10.5px',fontWeight:800,padding:'2px 7px',borderRadius:'4px',background:'#f3e8ff',color:'#6b21a8'}}>
              NEW
             </span>
            )}
           </td>
           <td style={{padding:'10px 14px'}}>
            <b style={{fontSize:'13px',color:'#0f172a',display:'block'}}>{d.name||'Missing name'}</b>
            <div style={{display:'flex',gap:'6px',alignItems:'center',marginTop:'2px'}}>
             <small className="bulk-pack-unit" style={{background:'#f1f5f9',padding:'1px 5px',borderRadius:'4px',fontWeight:700,color:'#334155'}}>{d.unit}</small>
             {d.sku && <small style={{fontSize:'10.5px',color:'#94a3b8'}}>{d.sku}</small>}
            </div>
           </td>
           <td style={{padding:'10px 14px',fontSize:'12.5px',color:'#334155'}}>{d.categoryName||d.category||'Unknown'}</td>

           {/* Cost Price */}
           <td style={{padding:'10px 14px',fontSize:'12.5px',whiteSpace:'nowrap'}}>
            <b style={{color:costChanged?'#0284c7':'#0f172a'}}>{money(d.costPrice||0)}</b>
            {costChanged && (
             <small style={{display:'block',fontSize:'10.5px',color:'#94a3b8',textDecoration:'line-through'}}>
              {money(curr.costPrice)}
             </small>
            )}
           </td>

           {/* MRP */}
           <td style={{padding:'10px 14px',fontSize:'12.5px',whiteSpace:'nowrap'}}>
            <span style={{color:mrpChanged?'#b45309':'#475569'}}>{money(d.mrp||0)}</span>
            {mrpChanged && (
             <small style={{display:'block',fontSize:'10.5px',color:'#94a3b8',textDecoration:'line-through'}}>
              {money(curr.mrp)}
             </small>
            )}
           </td>

           {/* Selling Price */}
           <td style={{padding:'10px 14px',fontSize:'12.5px',whiteSpace:'nowrap'}}>
            <b style={{color:priceChanged?'#15803d':'#0f172a'}}>{money(d.price||0)}</b>
            {priceChanged && (
             <small style={{display:'block',fontSize:'10.5px',color:'#94a3b8',textDecoration:'line-through'}}>
              {money(curr.price)}
             </small>
            )}
           </td>

           {/* Stock */}
           <td style={{padding:'10px 14px',fontSize:'12.5px',whiteSpace:'nowrap'}}>
            <span style={{fontWeight:700,color:d.stock<=0?'#dc2626':stockChanged?'#0284c7':'#0f172a'}}>
             {d.stock??'—'}
            </span>
            {stockChanged && (
             <small style={{display:'block',fontSize:'10.5px',color:'#94a3b8',textDecoration:'line-through'}}>
              {curr.stock}
             </small>
            )}
           </td>

           {/* Status */}
           <td style={{padding:'10px 14px',whiteSpace:'nowrap'}}>
            <span style={{fontSize:'10.5px',fontWeight:700,padding:'2px 6px',borderRadius:'4px',background:d.status==='ACTIVE'?'#dcfce7':'#fee2e2',color:d.status==='ACTIVE'?'#15803d':'#b91c1c'}}>
             {d.status}
            </span>
           </td>

           {/* Validation Status */}
           <td style={{padding:'10px 14px'}}>
            {row.valid ? (
             <span className="bulk-ready" style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'11.5px',color:'#16a34a',fontWeight:700}}>
              <Check size={14}/> Ready
             </span>
            ) : (
             <ul style={{margin:0,paddingLeft:'16px',color:'#dc2626',fontSize:'11px',lineHeight:1.3}}>
              {row.errors.map(text=><li key={text}>{text}</li>)}
             </ul>
            )}
           </td>
          </tr>
         );
        })}
       </tbody>
      </table>
     </div>

     {/* Footer Action Bar */}
     <div className="bulk-import-footer" style={{padding:'16px 20px',background:'#f8fafc',borderTop:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
      <p style={{margin:0,fontSize:'12.5px',color:'#64748b'}}>
       All rows are validated against MySQL rules. Existing items will have their Cost, MRP, Price, and Stock updated atomically.
      </p>
      <Button
       variant="primary"
       disabled={busy||invalidCount>0||!validCount}
       onClick={applyAll}
       style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 22px',fontWeight:800,fontSize:'13.5px'}}
      >
       <CheckCircle2 size={16}/> {busy ? 'Applying changes…' : `Apply Changes (${validCount} Products)`}
      </Button>
     </div>
    </section>
   )}
  </>
 );
}

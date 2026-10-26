export const deliveryColumns = [
  'Village / Locality Name',
  'Pincode',
  'Delivery Zone / Area',
  'Delivery Fee (₹)',
  'Minimum Order (₹)',
  'Free Delivery Above (₹)',
  'Radius (Km)',
  'Estimated Time (Mins)',
  'Allow COD (YES/NO)',
  'Status (ACTIVE/INACTIVE)',
  'Notes'
];

const download = (bytes, name, type) => {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

async function workbook() {
  const module = await import('exceljs');
  return new module.default.Workbook();
}

export async function downloadDeliveryTemplate(areas = []) {
  const book = await workbook();
  const sheet = book.addWorksheet('Delivery Addresses');
  sheet.addRow(deliveryColumns);

  // Styling Header
  const headerRow = sheet.getRow(1);
  headerRow.height = 26;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Sample Rows
  const sampleZone = areas[0]?.name || 'Town Central';
  sheet.addRow(['Ratan Chak', '841438', sampleZone, 25, 150, 499, 5.0, 25, 'YES', 'ACTIVE', 'Main road locality']);
  sheet.addRow(['Ekdanga', '841438', sampleZone, 30, 199, 500, 6.0, 30, 'YES', 'ACTIVE', 'Near high school']);

  sheet.columns = [
    { width: 28 }, // Village Name
    { width: 14 }, // Pincode
    { width: 24 }, // Zone
    { width: 16 }, // Fee
    { width: 18 }, // Min Order
    { width: 22 }, // Free Delivery
    { width: 14 }, // Radius
    { width: 22 }, // Est Time
    { width: 18 }, // COD
    { width: 22 }, // Status
    { width: 30 }  // Notes
  ];
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Instructions Sheet
  const help = book.addWorksheet('Instructions');
  [
    '1. "Village / Locality Name" is mandatory. Unique names only.',
    '2. "Pincode" should be a valid 6-digit postal code (e.g., 841438).',
    '3. "Delivery Zone / Area" is optional. Enter the zone name if you want to group under an area.',
    '4. "Delivery Fee", "Minimum Order", and "Free Delivery Above" must be positive whole numbers or 0.',
    '5. "Allow COD" must be YES or NO.',
    '6. "Status" must be ACTIVE or INACTIVE.',
    '7. Existing villages with the same name will be updated with your Excel rates; new ones will be created.'
  ].forEach(text => help.addRow([text]));
  help.getColumn(1).width = 110;

  // Active Zones Reference Sheet
  if (areas.length > 0) {
    const zoneSheet = book.addWorksheet('Available Zones');
    zoneSheet.addRow(['Zone Name', 'Base Fee', 'Radius (Km)']);
    areas.forEach(z => zoneSheet.addRow([z.name, Number(z.deliveryFee || 0), Number(z.radiusKm || 5)]));
    zoneSheet.columns.forEach(col => col.width = 25);
  }

  download(await book.xlsx.writeBuffer(), 'R2Cart_Delivery_Addresses_Template.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function downloadDeliveryExcel(villages = [], areas = []) {
  const book = await workbook();
  const sheet = book.addWorksheet('Delivery Addresses');
  sheet.addRow(deliveryColumns);

  // Styling Header
  const headerRow = sheet.getRow(1);
  headerRow.height = 26;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  const areaMap = new Map((areas || []).map(a => [a.id, a.name]));

  villages.forEach(v => {
    sheet.addRow([
      v.name || '',
      v.pincode || '',
      v.area?.name || areaMap.get(v.areaId) || '',
      Number(v.deliveryFee != null ? v.deliveryFee : 30),
      Number(v.minimumOrder != null ? v.minimumOrder : 150),
      Number(v.freeDeliveryThreshold != null ? v.freeDeliveryThreshold : 499),
      Number(v.radiusKm != null ? v.radiusKm : 5.0),
      Number(v.estimatedMinutes != null ? v.estimatedMinutes : 30),
      v.allowCod !== false ? 'YES' : 'NO',
      v.status || 'ACTIVE',
      v.notes || ''
    ]);
  });

  sheet.columns = [
    { width: 28 },
    { width: 14 },
    { width: 24 },
    { width: 16 },
    { width: 18 },
    { width: 22 },
    { width: 14 },
    { width: 22 },
    { width: 18 },
    { width: 22 },
    { width: 30 }
  ];
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  download(await book.xlsx.writeBuffer(), `R2Cart_Delivery_Addresses_${new Date().toISOString().slice(0, 10)}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function readDeliveryFile(file) {
  const buffer = await file.arrayBuffer();
  const book = await workbook();

  if (file.name.toLowerCase().endsWith('.csv')) {
    await book.csv.read(new Blob([buffer]).stream());
  } else {
    await book.xlsx.load(buffer);
  }

  const sheet = book.worksheets[0];
  if (!sheet) throw new Error('Excel workbook has no sheets.');

  const headerRow = sheet.getRow(1);
  const columnMap = new Map();
  headerRow.eachCell((cell, colNumber) => {
    const text = String(cell.text || cell.value || '').trim().toLowerCase();
    if (text) {
      columnMap.set(colNumber, text);
    }
  });

  const findCol = (...aliases) => {
    for (const [colNumber, text] of columnMap.entries()) {
      if (aliases.some(alias => text.includes(alias.toLowerCase()))) {
        return colNumber;
      }
    }
    return null;
  };

  const nameCol = findCol('village', 'locality', 'name', 'address');
  if (!nameCol) {
    throw new Error('Could not find "Village / Locality Name" column in Excel sheet.');
  }

  const pinCol = findCol('pin', 'postal');
  const zoneCol = findCol('delivery zone', 'zone', 'area');
  const feeCol = findCol('delivery fee', 'fee', 'charge');
  const minCol = findCol('minimum order', 'minimum', 'min order');
  const freeCol = findCol('free delivery', 'threshold', 'free above');
  const radCol = findCol('radius');
  const timeCol = findCol('estimated time', 'time', 'minute');
  const codCol = findCol('allow cod', 'cod');
  const statusCol = findCol('status');
  const notesCol = findCol('notes', 'remark');

  const rows = [];
  const errors = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const nameVal = row.getCell(nameCol)?.text?.trim() || String(row.getCell(nameCol)?.value || '').trim();
    if (!nameVal) return; // skip blank row

    const getNum = (col, def) => {
      if (!col) return def;
      const raw = row.getCell(col)?.value;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : def;
    };

    const getStr = (col) => {
      if (!col) return '';
      const cell = row.getCell(col);
      if (!cell || cell.value == null) return '';
      if (typeof cell.value === 'object') {
        if (cell.text) return String(cell.text).trim();
        if (cell.value.result != null) return String(cell.value.result).trim();
        return '';
      }
      return String(cell.value).trim();
    };

    const pincode = getStr(pinCol);
    const rawZone = getStr(zoneCol);
    const zoneName = rawZone || 'Hathua';
    const deliveryFee = getNum(feeCol, 30);
    const minimumOrder = getNum(minCol, 150);
    const freeDeliveryThreshold = getNum(freeCol, 499);
    const radiusKm = getNum(radCol, 5.0);
    const estimatedMinutes = getNum(timeCol, 30);
    const codVal = getStr(codCol).toUpperCase();
    const statusVal = getStr(statusCol).toUpperCase();
    const notes = getStr(notesCol);

    rows.push({
      rowNumber,
      name: nameVal,
      pincode: pincode || null,
      zoneName: zoneName,
      areaName: zoneName,
      deliveryFee,
      minimumOrder,
      freeDeliveryThreshold,
      radiusKm: radiusKm > 0 ? radiusKm : 5.0,
      estimatedMinutes: estimatedMinutes > 0 ? estimatedMinutes : 30,
      allowCod: codVal !== 'NO',
      status: statusVal === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      notes: notes || null
    });
  });

  if (!rows.length) {
    throw new Error('No valid delivery village / address rows found in this sheet.');
  }

  return { rows, errors };
}

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Plus, Check } from 'lucide-react';

export const POPULAR_GROCERY_UNITS = [
  { group: 'Weight', units: ['50 g', '100 g', '200 g', '250 g', '500 g', '1 kg', '2 kg', '5 kg', '10 kg', '25 kg'] },
  { group: 'Volume / Liquids', units: ['100 ml', '200 ml', '250 ml', '500 ml', '750 ml', '1 L', '2 L', '5 L'] },
  { group: 'Pieces & Packs', units: ['1 pc', '2 pcs', '4 pcs', '6 pcs', '12 pcs', '1 Pack', 'Pack of 2', 'Pack of 4', '1 Box', '1 Dozen', 'Combo Pack'] },
  { group: 'Fresh Produce / Bunches', units: ['1 Bunch', '500 g (Approx. 3-4 pcs)', '1 kg (Approx. 4-6 pcs)', '250 g (Approx. 1-2 pcs)'] }
];

export default function UnitSelector({ value, onChange, placeholder = 'e.g. 500 g or 1 kg', disabled = false, required = true }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered categories
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_GROCERY_UNITS;

    return POPULAR_GROCERY_UNITS.map((group) => ({
      ...group,
      units: group.units.filter((u) => u.toLowerCase().includes(q))
    })).filter((group) => group.units.length > 0);
  }, [query]);

  const selectUnit = (selected) => {
    setQuery(selected);
    onChange(selected);
    setOpen(false);
  };

  const isExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return POPULAR_GROCERY_UNITS.some((g) => g.units.some((u) => u.toLowerCase() === q));
  }, [query]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input row with search & dropdown chevron */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'hidden',
          transition: 'border-color 0.15s ease'
        }}
        onFocus={() => setOpen(true)}
      >
        <input
          type="text"
          value={query}
          disabled={disabled}
          required={required}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val);
            setOpen(true);
          }}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '10px 12px',
            fontSize: '13.5px',
            color: '#0f172a',
            background: 'transparent'
          }}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '10px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: '#64748b'
          }}
          aria-label="Toggle units list"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Floating Dropdown Popover */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.12)',
            zIndex: 100,
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '8px',
            boxSizing: 'border-box'
          }}
        >
          {/* Custom entry button if query is not empty and not an exact match */}
          {query.trim() && !isExactMatch && (
            <button
              type="button"
              onClick={() => selectUnit(query.trim())}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '8px'
              }}
            >
              <Plus size={15} />
              <span>Use custom unit: “{query.trim()}”</span>
            </button>
          )}

          {/* Grouped Units List */}
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div key={group.group} style={{ marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    letterSpacing: '0.5px',
                    display: 'block',
                    padding: '4px 8px 2px'
                  }}
                >
                  {group.group}
                </span>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '4px 6px' }}>
                  {group.units.map((unit) => {
                    const isSelected = value === unit;
                    return (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => selectUnit(unit)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #059669' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0fdf4' : '#f8fafc',
                          color: isSelected ? '#059669' : '#334155',
                          fontSize: '12px',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                        <span>{unit}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
              No matching standard unit. You can enter any custom unit above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

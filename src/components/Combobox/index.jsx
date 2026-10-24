'use client';
import { useId, useRef, useState } from 'react';
import s from './style/index.module.scss';

// Searchable dropdown that also accepts new values (ARIA combobox pattern).
// options: [{ value, count? }]. Typing filters; Enter picks the highlighted option or adds what was typed.
export default function Combobox({ value, onChange, options, placeholder, required, addLabel = 'Add', 'aria-label': ariaLabel }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(null); // null = not searching, show the value
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const text = query ?? value;
  const needle = (query ?? '').trim().toLowerCase();
  const shown = needle ? options.filter((o) => o.value.toLowerCase().includes(needle)) : options;
  const typed = (query ?? '').trim();
  const canAdd = typed && !options.some((o) => o.value.toLowerCase() === typed.toLowerCase());
  const items = [...shown.map((o) => ({ ...o, add: false })), ...(canAdd ? [{ value: typed, add: true }] : [])];

  const pick = (v) => { onChange(v); setQuery(null); setOpen(false); };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive((i) => (items.length ? (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length : 0));
    } else if (e.key === 'Enter' && open && items[active]) {
      e.preventDefault(); // don't submit the form while choosing
      pick(items[active].value);
    } else if (e.key === 'Escape') {
      setQuery(null); setOpen(false);
    }
  };

  return (
    <div className={s.box}>
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && items[active] ? `${id}-${active}` : undefined}
        aria-label={ariaLabel}
        value={text}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onBlur={() => { if (query !== null && query.trim()) onChange(query.trim()); setQuery(null); setOpen(false); }}
        onKeyDown={onKeyDown}
      />
      <button type="button" tabIndex={-1} className={s.chevron} aria-label="Show options"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); inputRef.current?.focus(); }}>▾</button>
      {open && (
        <ul id={`${id}-list`} role="listbox" className={s.list}>
          {items.length === 0 && <li className={s.empty}>Type to add a new one</li>}
          {items.map((o, i) => (
            <li
              key={`${o.add}-${o.value}`}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`${s.option} ${i === active ? s.active : ''} ${o.add ? s.add : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(o.value); }} // mousedown keeps focus in the input
              onMouseEnter={() => setActive(i)}
            >
              {o.add ? <>+ {addLabel} “{o.value}”</> : <><span>{o.value}</span>{o.count != null && <small>{o.count}</small>}</>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

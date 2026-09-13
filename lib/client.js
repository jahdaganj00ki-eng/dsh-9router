window.__ModuleLoader__.load({
  id: 'dsh-9router',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')

    // We reuse the Harness icon pack indirectly via css only; keep this client self-contained
    const CSS = `
      .nr-root{ box-sizing:border-box; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color: var(--dsw-alias-label-primary, #171717); }
      .nr-shell{ max-width: 1120px; margin: 0 auto; padding: 18px 16px 40px; display:flex; flex-direction:column; gap:16px; }
      .nr-topbar{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
      .nr-title{ font-size:22px; font-weight:700; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px; }
      .nr-badge{ font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:3px 8px; border-radius:999px; background:#111; color:#fff; }
      .nr-sub{ color: var(--dsw-alias-label-secondary, #6b7280); font-size:13px; line-height:20px; max-width:720px; }
      .nr-tabs{ display:flex; gap:8px; flex-wrap:wrap; border-bottom:1px solid var(--dsw-alias-border-l2, #e5e7eb); padding-bottom:10px; }
      .nr-tab{ appearance:none; border:1px solid var(--dsw-alias-border-l2, #e5e7eb); background: var(--dsw-alias-bg-layer-1,#fff); color:inherit; padding:7px 12px; border-radius:999px; font-size:13px; font-weight:600; cursor:pointer; }
      .nr-tab.is-active{ background:#111; color:#fff; border-color:#111; }
      .nr-grid{ display:grid; grid-template-columns: 1fr 1fr; gap:14px; }
      @media (max-width: 900px){ .nr-grid{ grid-template-columns:1fr; } }
      .nr-card{ border:1px solid var(--dsw-alias-border-l2, #e5e7eb); background: var(--dsw-alias-bg-layer-1,#fff); border-radius:14px; padding:14px; display:flex; flex-direction:column; gap:10px; }
      .nr-cardHead{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .nr-cardTitle{ font-weight:700; font-size:14px; }
      .nr-muted{ color: var(--dsw-alias-label-tertiary, #6b7280); font-size:12px; }
      .nr-row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
      .nr-input, .nr-select, .nr-textarea{ box-sizing:border-box; width:100%; border:1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-module-platform,#fff); color:inherit; border-radius:10px; padding:9px 10px; font:inherit; font-size:13px; }
      .nr-textarea{ min-height:84px; resize:vertical; }
      .nr-btn{ appearance:none; border:1px solid var(--dsw-alias-border-l2,#e5e7eb); background:#111; color:#fff; border-radius:999px; padding:8px 14px; font-size:13px; font-weight:700; cursor:pointer; }
      .nr-btn:disabled{ opacity:0.5; cursor:default; }
      .nr-btnGhost{ background: var(--dsw-alias-bg-layer-2,#f3f4f6); color:inherit; border-color: var(--dsw-alias-border-l2,#e5e7eb); }
      .nr-btnSmall{ padding:6px 10px; font-size:12px; }
      .nr-kv{ display:grid; grid-template-columns: 140px 1fr; gap:8px; font-size:13px; }
      .nr-code{ font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); border:1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius:10px; padding:10px; overflow:auto; white-space:pre-wrap; word-break:break-word; }
      .nr-providers{ display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px; }
      .nr-prov{ border:1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-layer-1,#fff); border-radius:14px; padding:12px; display:flex; flex-direction:column; gap:10px; }
      .nr-provHead{ display:flex; align-items:center; gap:10px; }
      .nr-dot{ width:10px; height:10px; border-radius:50%; flex:none; }
      .nr-tag{ font-size:11px; padding:2px 7px; border-radius:999px; border:1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-layer-2,#f3f4f6); }
      .nr-pill{ display:inline-flex; align-items:center; gap:6px; font-size:12px; padding:4px 8px; border-radius:999px; border:1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-layer-2,#f3f4f6); }
      .nr-list{ display:flex; flex-direction:column; gap:8px; }
      .nr-comboRow{ display:flex; align-items:center; justify-content:space-between; gap:10px; border:1px dashed var(--dsw-alias-border-l2,#e5e7eb); border-radius:12px; padding:10px 12px; }
      .nr-usageHead{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
      .nr-stat{ font-size:22px; font-weight:800; }
      .nr-table{ width:100%; border-collapse: collapse; font-size:13px; }
      .nr-table th, .nr-table td{ text-align:left; padding:8px 8px; border-bottom:1px solid var(--dsw-alias-border-l2,#e5e7eb); }
      .nr-empty{ color: var(--dsw-alias-label-secondary,#6b7280); font-size:13px; padding:12px; border:1px dashed var(--dsw-alias-border-l2,#e5e7eb); border-radius:12px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); }
      .nr-notice{ padding:10px 12px; border-radius:12px; border:1px solid #f59e0b; background:#fffbeb; color:#92400e; font-size:13px; }
      .nr-error{ padding:10px 12px; border-radius:12px; border:1px solid #ef4444; background:#fef2f2; color:#991b1b; font-size:13px; }
      .nr-link{ color: var(--dsw-alias-link, #2563eb); text-decoration:none; }
      .nr-link:hover{ text-decoration:underline; }
    `

    function installStyles(){
      if (document.querySelector('style[data-plugin-css="dsh-9router"]')) return
      const s=document.createElement('style')
      s.dataset.plugin='dsh-9router'
      s.dataset.pluginCss='dsh-9router'
      s.textContent=CSS
      document.head.appendChild(s)
    }

    const API = '/api/9router'
    async function api(path, opts){
      const res = await fetch(`${API}${path}`, {
        method: (opts && opts.method) || 'GET',
        headers: { 'content-type':'application/json', ...(opts && opts.headers || {}) },
        body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
        credentials: 'same-origin',
        cache:'no-store',
      })
      const text = await res.text()
      let data
      try{ data = text ? JSON.parse(text) : {} } catch{ data={ raw:text } }
      if(!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`)
      return data
    }

    function use9Router(){
      const [providers, setProviders] = React.useState(null)
      const [combos, setCombos] = React.useState(null)
      const [models, setModels] = React.useState(null)
      const [status, setStatus] = React.useState(null)
      const [usage, setUsage] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const load = React.useCallback(async ()=>{
        setError(null)
        try{
          const [p,c,m,s,u] = await Promise.all([
            api('/providers').catch(e=>{ throw e }),
            api('/combos').catch(()=>({combos:[]})),
            api('/models').catch(()=>({models:[]})),
            api('/status').catch(()=>null),
            api('/usage').catch(()=>null),
          ])
          setProviders(p.providers || p)
          setCombos((c.combos||c) || [])
          setModels((m.models||[]) )
          setStatus(s)
          setUsage(u)
        } catch(e){ setError(e.message || String(e)) }
      }, [])
      React.useEffect(()=>{ load() }, [load])
      return { providers, combos, models, status, usage, error, busy, setBusy, load, setError }
    }

    function formatModels(list){
      if(!list || !list.length) return '—'
      return list.join(' → ')
    }

    function ProviderCard({ prov, onChanged }){
      const [open, setOpen] = React.useState(false)
      const [form, setForm] = React.useState({ apiKey:'', baseUrl:'', name:'' })
      const [saving, setSaving] = React.useState(false)
      const [testing, setTesting] = React.useState(false)
      const [msg, setMsg] = React.useState(null)
      const hasConn = (prov.connections && prov.connections.length>0)
      const add = async ()=>{
        if(!form.apiKey && prov.category==='apikey'){ setMsg('API key required'); return }
        setSaving(true); setMsg(null)
        try{
          await api('/connections', { method:'POST', body:{
            provider: prov.id,
            authType: prov.category==='local' ? 'none' : 'apikey',
            apiKey: form.apiKey || undefined,
            baseUrl: form.baseUrl || undefined,
            name: form.name || undefined,
          }})
          setForm({apiKey:'', baseUrl:'', name:''})
          setMsg('Saved.')
          onChanged()
        } catch(e){ setMsg(e.message) }
        finally{ setSaving(false) }
      }
      const remove = async (id)=>{
        if(!confirm('Remove this connection?')) return
        try{ await api(`/connections/${encodeURIComponent(id)}`, { method:'DELETE' }); onChanged() } catch(e){ setMsg(e.message) }
      }
      const ping = async ()=>{
        setTesting(true); setMsg(null)
        try{
          const r = await api('/providers/test', { method:'POST', body:{ provider: prov.id }})
          setMsg(r.ok ? `OK: ${String(r.preview||'').slice(0,120)}` : r.error || 'Failed')
        } catch(e){ setMsg('Test failed: '+ e.message)}
        finally{ setTesting(false)}
      }
      return React.createElement('div',{className:'nr-prov'},
        React.createElement('div',{className:'nr-provHead'},
          React.createElement('span',{className:'nr-dot', style:{background: prov.display?.color || '#111'}}),
          React.createElement('div',{style:{minWidth:0, flex:1}},
            React.createElement('div',{style:{fontWeight:700, fontSize:13}}, prov.display?.name || prov.id),
            React.createElement('div',{className:'nr-muted'}, prov.id + (prov.alias? ` • alias ${prov.alias}`:'') + ` • ${prov.category}`)
          ),
          React.createElement('span',{className:'nr-tag'}, hasConn ? `${prov.connections.length} conn` : 'no key')
        ),
        prov.models && prov.models.length ? React.createElement('div',{className:'nr-muted', style:{fontSize:12}}, `Models: ${prov.models.slice(0,6).map(m=>m.id).join(', ')}${prov.models.length>6?' …':''}`) : null,
        hasConn ? React.createElement('div',{className:'nr-list'},
          prov.connections.map(c=> React.createElement('div',{key:c.id, className:'nr-code', style:{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}},
            React.createElement('span',null, `${c.name||c.email||c.id.slice(0,8)} • prio ${c.priority??'-'} • ${c.testStatus||'unknown'}`),
            React.createElement('button',{className:'nr-btn nr-btnSmall nr-btnGhost', onClick:()=>remove(c.id)}, 'Remove')
          ))
        ): null,
        React.createElement('div',{style:{display:'flex', gap:8, flexWrap:'wrap'}},
          React.createElement('button',{className:'nr-btn nr-btnSmall nr-btnGhost', onClick:()=>setOpen(v=>!v)}, open? 'Close':'Add key / endpoint'),
          hasConn ? React.createElement('button',{className:'nr-btn nr-btnSmall nr-btnGhost', disabled:testing, onClick:ping}, testing?'Testing…':'Test') : null,
        ),
        open ? React.createElement('div',{style:{display:'flex', flexDirection:'column', gap:8}},
          React.createElement('input',{className:'nr-input', placeholder: prov.category==='apikey' ? 'API key (sk-…)' : 'Optional baseUrl override', value: prov.category==='apikey'? form.apiKey: form.baseUrl, onChange:e=> setForm(s=> ({...s, [prov.category==='apikey'?'apiKey':'baseUrl']: e.target.value}))}),
          React.createElement('div',{style:{display:'flex', gap:8}},
            React.createElement('input',{className:'nr-input', placeholder:'Label (optional)', value:form.name, onChange:e=> setForm(s=>({...s, name:e.target.value})), style:{flex:1}}),
            React.createElement('button',{className:'nr-btn nr-btnSmall', disabled:saving, onClick:add}, saving?'Saving…':'Save')
          ),
          React.createElement('div',{className:'nr-muted', style:{fontSize:11}}, 'Keys are stored under ', React.createElement('code',null, '~/.dsh/dsh-9router/'), ' and never leave this host except toward the provider.')
        ): null,
        msg ? React.createElement('div',{className:'nr-muted', style:{fontSize:12, whiteSpace:'pre-wrap'}}, msg) : null,
      )
    }

    function ProvidersTab({ data, onChanged }){
      const [q, setQ] = React.useState('')
      if(!data) return React.createElement('div',{className:'nr-muted'}, 'Loading providers…')
      const list = q ? data.filter(p=> (p.display?.name||p.id).toLowerCase().includes(q.toLowerCase()) || p.id.includes(q.toLowerCase())) : data
      return React.createElement('div',{style:{display:'flex', flexDirection:'column', gap:12}},
        React.createElement('div',{className:'nr-row'},
          React.createElement('input',{className:'nr-input', placeholder:'Search provider (e.g. openai, anthropic, gemini)', value:q, onChange:e=> setQ(e.target.value), style:{maxWidth:360}}),
          React.createElement('span',{className:'nr-muted'}, `${list.length} / ${data.length} providers`),
          React.createElement('a',{className:'nr-link', href:'https://github.com/decolua/9router', target:'_blank', rel:'noopener noreferrer'}, 'Upstream 9Router ↗')
        ),
        React.createElement('div',{className:'nr-providers'}, list.map(p=> React.createElement(ProviderCard,{key:p.id, prov:p, onChanged}))),
        React.createElement('div',{className:'nr-notice'}, 'Tip: Add at least one key, then rerun a model from the Harness picker. The “9Router” provider appears instantly — no restart required.')
      )
    }

    function CombosTab({ combos, onChanged }){
      const [name, setName] = React.useState('')
      const [modelsText, setModelsText] = React.useState('openai/gpt-4o, anthropic/claude-sonnet-4-20250514, gemini/gemini-2.5-flash')
      const [kind, setKind] = React.useState('llm')
      const [busy, setBusy] = React.useState(false)
      const [err, setErr] = React.useState(null)
      const create = async ()=>{
        setErr(null)
        if(!name.trim()){ setErr('Name required'); return }
        const models = modelsText.split(/[,\n]+/).map(s=> s.trim()).filter(Boolean)
        if(!models.length){ setErr('At least one model required'); return }
        setBusy(true)
        try{
          await api('/combos', { method:'POST', body:{ name: name.trim(), kind, models }})
          setName(''); setModelsText(''); onChanged()
        } catch(e){ setErr(e.message) } finally{ setBusy(false) }
      }
      const remove = async (id)=>{
        if(!confirm('Delete combo '+ id +'?')) return
        try{ await api(`/combos/${encodeURIComponent(id)}`, { method:'DELETE' }); onChanged() } catch(e){ setErr(e.message) }
      }
      return React.createElement('div',{style:{display:'flex', flexDirection:'column', gap:12}},
        React.createElement('div',{className:'nr-card'},
          React.createElement('div',{className:'nr-cardTitle'}, 'New combo (appears instantly in the DSH model picker)'),
          React.createElement('div',{className:'nr-grid'},
            React.createElement('label',{style:{display:'flex', flexDirection:'column', gap:6}},
              React.createElement('span',{className:'nr-muted'}, 'Name (ID used as model — e.g. auto, code, reasoning)'),
              React.createElement('input',{className:'nr-input', value:name, onChange:e=> setName(e.target.value), placeholder:'auto'})
            ),
            React.createElement('label',{style:{display:'flex', flexDirection:'column', gap:6}},
              React.createElement('span',{className:'nr-muted'}, 'Kind'),
              React.createElement('select',{className:'nr-select', value:kind, onChange:e=> setKind(e.target.value)},
                React.createElement('option',{value:'llm'}, 'llm'),
                React.createElement('option',{value:'embedding'}, 'embedding'),
                React.createElement('option',{value:'tts'}, 'tts'),
                React.createElement('option',{value:'image'}, 'image'),
              )
            ),
          ),
          React.createElement('label',{style:{display:'flex', flexDirection:'column', gap:6}},
            React.createElement('span',{className:'nr-muted'}, 'Models (comma or newline separated, e.g. openai/gpt-4o, anthropic/claude-sonnet-4-20250514)'),
            React.createElement('textarea',{className:'nr-textarea', value:modelsText, onChange:e=> setModelsText(e.target.value), placeholder:'openai/gpt-4o, anthropic/claude-sonnet-4-20250514'})
          ),
          err ? React.createElement('div',{className:'nr-error'}, err) : null,
          React.createElement('div',{className:'nr-row'},
            React.createElement('button',{className:'nr-btn', disabled:busy, onClick:create}, busy?'Creating…':'Create combo'),
            React.createElement('span',{className:'nr-muted'}, 'Combos are Harness-native: they show up under provider “9Router” immediately after creation.')
          ),
        ),
        !combos ? React.createElement('div',{className:'nr-muted'}, 'Loading…') :
        combos.length===0 ? React.createElement('div',{className:'nr-empty'}, 'No combos yet. The defaults (auto, reasoning, speed, code) are seeded on first launch.') :
        React.createElement('div',{className:'nr-list'}, combos.map(c=> React.createElement('div',{key:c.id, className:'nr-comboRow'},
          React.createElement('div',null,
            React.createElement('div',{style:{fontWeight:700, fontSize:13}}, c.name, React.createElement('span',{className:'nr-tag', style:{marginLeft:8}}, c.kind||'llm')),
            React.createElement('div',{className:'nr-muted', style:{fontSize:12, marginTop:4}}, formatModels(c.models))
          ),
          React.createElement('button',{className:'nr-btn nr-btnSmall nr-btnGhost', onClick:()=>remove(c.id)}, 'Delete')
        )))
      )
    }

    function EndpointTab(){
      const url = location.origin
      const ep1 = `${url}/api/9router/v1`
      const ep2 = `${url}/v1`
      const [key, setKey] = React.useState('')
      const [keys, setKeys] = React.useState(null)
      const [msg, setMsg] = React.useState(null)
      const loadKeys = async ()=>{ try{ const r=await api('/keys'); setKeys(r.keys||[]) }catch{} }
      React.useEffect(()=>{ loadKeys() }, [])
      const addKey = async ()=>{
        if(!key.trim()){ setMsg('Key required'); return }
        try{ await api('/keys', { method:'POST', body:{ key: key.trim(), name:'gateway' }}); setKey(''); setMsg('Added.'); loadKeys() } catch(e){ setMsg(e.message) }
      }
      const delKey = async (id)=>{ if(!confirm('Delete key?'))return; try{ await api(`/keys/${encodeURIComponent(id)}`, {method:'DELETE'}); loadKeys()}catch(e){ setMsg(e.message)}}
      const copy = (t)=> navigator.clipboard?.writeText(t).then(()=> setMsg('Copied.')).catch(()=>{})
      return React.createElement('div',{style:{display:'flex', flexDirection:'column', gap:12}},
        React.createElement('div',{className:'nr-grid'},
          React.createElement('div',{className:'nr-card'},
            React.createElement('div',{className:'nr-cardTitle'}, 'OpenAI-compatible endpoint'),
            React.createElement('div',{className:'nr-muted'}, 'Point any OpenAI SDK / CLI at the harness origin. No separate port.'),
            React.createElement('div',{className:'nr-code'}, `Base URL (preferred):\n${ep1}\n\nFallback (direct):\n${ep2}\n\n# example\ncurl ${ep1}/chat/completions \\\n  -H "Authorization: Bearer <9router-key>" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"auto","messages":[{"role":"user","content":"hello"}]}'`),
            React.createElement('div',{className:'nr-row'},
              React.createElement('button',{className:'nr-btn nr-btnSmall nr-btnGhost', onClick:()=>copy(ep1)}, 'Copy base URL'),
              React.createElement('button',{className:'nr-btn nr-btnSmall nr-btnGhost', onClick:()=>copy(`${ep1}/chat/completions`)}, 'Copy chat URL'),
            )
          ),
          React.createElement('div',{className:'nr-card'},
            React.createElement('div',{className:'nr-cardTitle'}, 'Gateway API keys'),
            React.createElement('div',{className:'nr-muted'}, 'If no keys exist, the gateway is open (matches fresh 9Router). Add a key to require Bearer auth.'),
            React.createElement('div',{className:'nr-row'},
              React.createElement('input',{className:'nr-input', placeholder:'new key (e.g. sk-9r-...)', value:key, onChange:e=> setKey(e.target.value), style:{flex:1}}),
              React.createElement('button',{className:'nr-btn nr-btnSmall', onClick:addKey}, 'Add')
            ),
            keys && keys.length ? React.createElement('div',{className:'nr-list'}, keys.map(k=> React.createElement('div',{key:k.id, className:'nr-code', style:{display:'flex', justifyContent:'space-between', gap:8}},
              React.createElement('span',null, `${k.name||k.id.slice(0,8)} • ${k.key.slice(0,10)}…`),
              React.createElement('button',{className:'nr-btn nr-btnSmall nr-btnGhost', onClick:()=>delKey(k.id)}, 'Delete')
            ))) : React.createElement('div',{className:'nr-muted', style:{fontSize:12}}, 'No keys yet.'),
            msg ? React.createElement('div',{className:'nr-muted', style:{fontSize:12}}, msg) : null,
            React.createElement('div',{className:'nr-code'}, `Models list:\nGET ${ep1}/models\nGET /api/9router/models  (dashboard)`),
          )
        ),
        React.createElement('div',{className:'nr-card'},
          React.createElement('div',{className:'nr-cardTitle'}, 'CLI tools (Claude Code, Codex, Gemini CLI, etc.)'),
          React.createElement('div',{className:'nr-muted'}, 'Set the tool to talk OpenAI-compat through the Harness origin. No second server.'),
          React.createElement('div',{className:'nr-code'}, `ANTHROPIC_BASE_URL=${ep1}\nANTHROPIC_API_KEY=<9router-key>\n# then run your CLI as usual\n\n# Codex\nOPENAI_BASE_URL=${ep1}\nOPENAI_API_KEY=<9router-key>`),
          React.createElement('div',{className:'nr-notice'}, 'OAuth providers (Codex, Antigravity) need no extra config — add their connection under “Providers” and they are routed automatically.')
        )
      )
    }

    function UsageTab({ usage }){
      if(!usage) return React.createElement('div',{className:'nr-muted'}, 'Loading usage…')
      const hist = usage.history || []
      const total = usage.total || hist.length
      const byProv = {}
      for(const h of hist){ byProv[h.provider] = (byProv[h.provider]||0)+1 }
      return React.createElement('div',{style:{display:'flex', flexDirection:'column', gap:14}},
        React.createElement('div',{className:'nr-card'},
          React.createElement('div',{className:'nr-usageHead'},
            React.createElement('span',{className:'nr-stat'}, String(total)),
            React.createElement('span',{className:'nr-muted'}, 'requests logged (last 5k retained)'),
          ),
          React.createElement('div',{className:'nr-muted', style:{fontSize:12}}, Object.keys(byProv).length ? `By provider: ${Object.entries(byProv).map(([k,v])=> `${k} ${v}`).join(' • ')}` : 'No requests yet.'),
          hist.length ? React.createElement('table',{className:'nr-table'},
            React.createElement('thead',null, React.createElement('tr',null,
              React.createElement('th',null,'Time'),
              React.createElement('th',null,'Model'),
              React.createElement('th',null,'Provider'),
              React.createElement('th',null,'Tokens'),
              React.createElement('th',null,'TTFT'),
            )),
            React.createElement('tbody',null, hist.slice(0,80).map((h,i)=> React.createElement('tr',{key:i},
              React.createElement('td',null, new Date(h.timestamp).toLocaleString()),
              React.createElement('td',null, h.apiModel || h.model),
              React.createElement('td',null, h.provider),
              React.createElement('td',null, h.tokens ? `${h.tokens.inputTokens||0}→${h.tokens.outputTokens||0}` : '—'),
              React.createElement('td',null, h.latency?.ttft ? `${h.latency.ttft}ms`: '—'),
            ))))
          : React.createElement('div',{className:'nr-empty'}, 'No usage yet. Send a chat via the Harness (pick a 9Router model) or curl /api/9router/v1/chat/completions.')
        ),
        React.createElement('div',{className:'nr-muted', style:{fontSize:12}}, 'Stored at ', React.createElement('code',null, '~/.dsh/dsh-9router/usageHistory.json'), ' — delete the file to reset.')
      )
    }

    function SettingsTab({ status, onChanged }){
      const [patch, setPatch] = React.useState({})
      const [msg, setMsg] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      React.useEffect(()=>{ if(status?.settings) setPatch(status.settings) }, [status])
      const save = async ()=>{
        setBusy(true); setMsg(null)
        try{ await api('/settings', { method:'PUT', body: patch }); setMsg('Saved.'); onChanged() } catch(e){ setMsg(e.message)} finally{ setBusy(false)}
      }
      if(!status) return React.createElement('div',{className:'nr-muted'}, 'Loading…')
      return React.createElement('div',{style:{display:'flex', flexDirection:'column', gap:12}},
        React.createElement('div',{className:'nr-card'},
          React.createElement('div',{className:'nr-cardTitle'}, 'Gateway & routing'),
          React.createElement('div',{className:'nr-muted'}, 'These settings live at ', React.createElement('code',null,'~/.dsh/dsh-9router/settings.json'), ' and are read on every request (no restart).'),
          React.createElement('div',{className:'nr-grid'},
            React.createElement('label',{style:{display:'flex', flexDirection:'column', gap:6}},
              React.createElement('span',{className:'nr-muted'}, 'Combo strategy (default when a combo has no per-combo override)'),
              React.createElement('select',{className:'nr-select', value: patch.comboStrategy||'fallback', onChange:e=> setPatch(s=>({...s, comboStrategy:e.target.value}))},
                React.createElement('option',{value:'fallback'}, 'fallback — try next on 429/5xx'),
                React.createElement('option',{value:'roundRobin'}, 'roundRobin — cycle candidates'),
                React.createElement('option',{value:'fusion'}, 'fusion — experimental')
              )
            ),
            React.createElement('label',{style:{display:'flex', flexDirection:'column', gap:6}},
              React.createElement('span',{className:'nr-muted'}, 'Sticky round-robin limit (combo)'),
              React.createElement('input',{className:'nr-input', type:'number', value: patch.comboStickyRoundRobinLimit ?? 1, onChange:e=> setPatch(s=>({...s, comboStickyRoundRobinLimit: parseInt(e.target.value,10)||1}))})
            ),
          ),
          React.createElement('div',{className:'nr-row'},
            React.createElement('button',{className:'nr-btn', disabled:busy, onClick:save}, busy?'Saving…':'Save settings'),
            msg ? React.createElement('span',{className:'nr-muted'}, msg) : null
          )
        ),
        React.createElement('div',{className:'nr-card'},
          React.createElement('div',{className:'nr-cardTitle'}, 'Data directory'),
          React.createElement('div',{className:'nr-code'}, status.gateway || '(unknown)'),
          React.createElement('div',{className:'nr-muted', style:{fontSize:12}}, 'Connections, combos, keys, usage — all JSON, portable across machines. Back it up like any dotfile.'),
          React.createElement('div',{className:'nr-grid'},
            React.createElement('div',{className:'nr-code'}, `Providers: ${status.registryProviders}\nConnections: ${status.connections}\nCombos: ${status.combos}\nKeys: ${status.apiKeys}`),
            React.createElement('div',{className:'nr-code'}, `Version: ${status.version}\nStore: ${status.gateway ? 'json (portable)' : 'unknown'}\nGateway auth: ${status.apiKeys>0 ? 'Bearer required' : 'open (no keys)'}`),
          )
        )
      )
    }

    function NineRouterDashboard(){
      installStyles()
      const { providers, combos, models, status, usage, error, load } = use9Router()
      const [tab, setTab] = React.useState('providers')
      const tabs = [
        {id:'providers', label:'Providers'},
        {id:'combos', label:'Combos'},
        {id:'endpoint', label:'Endpoint'},
        {id:'usage', label:'Usage'},
        {id:'settings', label:'Settings'},
      ]
      const pickerModels = models ? models.length : null
      const comboCount = combos ? combos.length : null
      return React.createElement('div',{className:'nr-root'},
        React.createElement('div',{className:'nr-shell'},
          React.createElement('div',{className:'nr-topbar'},
            React.createElement('div',null,
              React.createElement('div',{className:'nr-title'},
                React.createElement('span',null, '9Router'),
                React.createElement('span',{className:'nr-badge'}, 'DSH Plugin'),
                combos!==null ? React.createElement('span',{className:'nr-pill'}, `${comboCount} combos`) : null,
                pickerModels!==null ? React.createElement('span',{className:'nr-pill'}, `${pickerModels} models in picker`) : null,
              ),
              React.createElement('div',{className:'nr-sub'}, 'Full AI gateway inside DSH Desktop. Providers, combos, and the OpenAI endpoint are all served from the Harness — no second server. Pick any 9Router model directly from the DSH model picker.')
            ),
            React.createElement('div',{className:'nr-row'},
              React.createElement('button',{className:'nr-btn nr-btnGhost nr-btnSmall', onClick:load}, 'Refresh'),
              React.createElement('a',{className:'nr-btn nr-btnGhost nr-btnSmall', href:'https://github.com/decolua/9router', target:'_blank', rel:'noopener noreferrer'}, 'Docs ↗')
            )
          ),
          error ? React.createElement('div',{className:'nr-error'}, error) : null,
          React.createElement('div',{className:'nr-tabs'},
            tabs.map(t=> React.createElement('button',{key:t.id, className: 'nr-tab' + (tab===t.id?' is-active':''), onClick:()=> setTab(t.id)}, t.label))
          ),
          tab==='providers' ? React.createElement(ProvidersTab,{data:providers, onChanged:load}) : null,
          tab==='combos' ? React.createElement(CombosTab,{combos, onChanged:load}) : null,
          tab==='endpoint' ? React.createElement(EndpointTab,null) : null,
          tab==='usage' ? React.createElement(UsageTab,{usage}) : null,
          tab==='settings' ? React.createElement(SettingsTab,{status, onChanged:load}) : null,
          React.createElement('div',{className:'nr-muted', style:{fontSize:12, borderTop:'1px solid var(--dsw-alias-border-l2,#e5e7eb)', paddingTop:10}},
            '9Router for DSH Desktop — single “9Router” provider in the picker. Combos (e.g. auto, reasoning) and qualified models (e.g. openai/gpt-4o) are all routed through the same gateway with failover. Data: ', React.createElement('code',null,'~/.dsh/dsh-9router/'), ' • Endpoint: ', React.createElement('code',null,'/api/9router/*'), ' + ', React.createElement('code',null,'/v1/*')
          )
        )
      )
    }

    // Register into DSH: sidebar entry + settings split + model-picker via LLM catalog (host)
    const inject = ['slots','locale']
    function apply(ctx){
      installStyles()
      const NS='dsh-9router'
      const zh={ 'nav':'9Router', 'title':'9Router', 'desc':'AI Gateway — Providers, Combos & Endpoint' }
      const en={ 'nav':'9Router', 'title':'9Router', 'desc':'AI Gateway — Providers, Combos & Endpoint' }
      try{ ctx.effect(()=> ctx.locale.register(NS, { zh, en }), '9router: dictionaries') }catch{}
      // Sidebar is a single root slot that then parents its children; to avoid ordering issues
      // we register as list entry sibling? Easiest: inject under sidebar.footer.action + settings.section
      try{
        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name:'sidebar.footer.action',
          id:'9router',
          order: 20,
          locale: NS,
          inject: () => ({
            hooks: {},
            t: (ctx.locale && ctx.locale.bind) ? ctx.locale.bind(NS) : (k)=>k,
          })
        }, function FooterAction({ wide }){
          const label = '9Router'
          // render as a small button in footer
          return React.createElement('button',{
            type:'button',
            title: label,
            'aria-label': label,
            onClick: ()=>{
              // Settings is a modal overlay; open via dispatching a settings navigation?
              // Robust fallback: navigate hash to settings and highlight our section.
              try{
                // DSH 0.1.2 settings opens via overlay triggered by footer Settings; emulate by clicking settings trigger then selecting our section
                const trigger = document.querySelector('[data-dsh-sidebar-settings] button, button[aria-label*="Settings"], button[aria-label*="设置"]')
                // Instead, expose a query-param anchor: we rely on our Settings section being first-class, so just open settings
                // by toggling the internal settings store? Lightest: dispatch a custom event that settings will listen? Simpler: programmatically inject a one-shot that opens settings UI by appending #settings
                // Fallback that works: set location hash and re-render? DSH listens to settings via overlay — clicking the trigger is reliable.
                if(trigger) trigger.click()
                // after overlay opens, select our tab
                setTimeout(()=>{
                  const needle = Array.from(document.querySelectorAll('[role="tab"], button, a')).find(el=> (el.textContent||'').trim()==='9Router')
                  if(needle) needle.click()
                }, 350)
              }catch{}
            },
            style:{
              appearance:'none', border:'1px solid var(--dsw-alias-border-l2,#e5e7eb)', background:'var(--dsw-alias-bg-layer-2,#f3f4f6)',
              color:'inherit', borderRadius:999, padding: wide? '6px 12px':'6px', display:'inline-flex', alignItems:'center', gap:6,
              fontSize:12, fontWeight:700, cursor:'pointer'
            }
          }, wide ? label : '9R')
        }))

        // Also register a Settings section — this is the main dashboard. It uses the dedicated "9Router" section id.
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name:'settings.section',
          id:'9router',
          order: 5,
          label: ()=> '9Router',
          locale: NS,
          children:{
            'settings.9router.dashboard': { kind:'single', scope:'root' }
          },
          inject: () => ({ hooks:{} })
        }, function SettingsSection(){
          return React.createElement(NineRouterDashboard, null)
        }))

        // Some DSH builds require the section's children to be explicitly fulfilled; the dashboard itself renders tabs.
        // Provide a trivial occupant for the child slot so the tab always renders even if slot reconciliation is strict.
        ctx.slots.inject('settings.9router.dashboard', () => ctx.slots.register({
          name:'settings.9router.dashboard',
        }, NineRouterDashboard))

      }catch(e){
        // If slots not yet ready, fall back to injecting via generic conversation.hero slot once
        try{
          ctx.slots.inject('settings.section', ()=> ctx.slots.register({
            name:'settings.section', id:'9router-fallback', order:5, label:()=>'9Router', locale:NS
          }, NineRouterDashboard))
        }catch{}
      }
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  }
})


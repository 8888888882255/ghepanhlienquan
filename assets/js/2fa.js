// 2fa.js - TOTP Authenticator logic
    // ======= Utility: Base32 decode =======
    function base32ToBytes(base32) {
      if (!base32) return new Uint8Array();
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const cleaned = base32.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
      let bits = '';
      for (let ch of cleaned) {
        const idx = alphabet.indexOf(ch);
        if (idx === -1) continue;
        bits += idx.toString(2).padStart(5, '0');
      }
      const bytes = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substr(i, 8), 2));
      }
      return new Uint8Array(bytes);
    }

    // ======= TOTP generation using WebCrypto =======
    async function generateTOTP(secretBase32, digits = 6, period = 30) {
      try {
        const keyBytes = base32ToBytes(secretBase32);
        const counter = Math.floor(Date.now() / 1000 / period);
        const buf = new ArrayBuffer(8);
        const view = new DataView(buf);
        view.setUint32(0, Math.floor(counter / Math.pow(2, 32)));
        view.setUint32(4, counter & 0xffffffff);

        const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, {name: 'HMAC', hash: 'SHA-1'}, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', cryptoKey, buf);
        const hmac = new Uint8Array(sig);
        const offset = hmac[hmac.length - 1] & 0xf;
        const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
        const otp = (code % Math.pow(10, digits)).toString().padStart(digits, '0');
        return otp;
      } catch (e) {
        return 'ERR';
      }
    }

    // ======= otpauth:// builder =======
    function buildOtpauth({issuer, account, secret, digits = 6, period = 30}){
      const label = issuer ? (issuer + ':' + (account || '')) : (account || '');
      const u = `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer||'')}&digits=${digits}&period=${period}`;
      return u;
    }

    // ======= Storage management =======
    const STORAGE_KEY = 'twofa_accounts_v1';
    function loadAccounts(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
      }catch(e){return []}
    }
    function saveAccounts(arr){localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));}

    // ======= UI rendering and actions =======
    let accounts = loadAccounts();
    let selectedIndex = null;
    const accountListEl = document.getElementById('accountList');
    const issuerLabel = document.getElementById('issuerLabel');
    const accountLabel = document.getElementById('accountLabel');
    const codeDisplay = document.getElementById('codeDisplay');
    const countdownEl = document.getElementById('countdown');
    const qrEl = document.getElementById('qr');

    function renderList(){
      accountListEl.innerHTML = '';
      accounts.forEach((a, idx)=>{
        const el = document.createElement('div');
        el.className = 'account' + (idx === selectedIndex ? ' selected' : '');
        el.addEventListener('click', (e)=>{
          if (!e.target.closest('.icon-btn')) selectAccount(idx);
        });
        
        const av = document.createElement('div');
        av.className='avatar';
        av.textContent = (a.issuer||'U').slice(0,1).toUpperCase();
        
        const meta = document.createElement('div');
        meta.className='meta';
        const title = document.createElement('div');
        title.className='title';
        title.textContent = a.issuer || 'No name';
        const iss = document.createElement('div');
        iss.className='issuer';
        iss.textContent = a.account || a.secret.slice(0,12) + '...';
        meta.appendChild(title);
        meta.appendChild(iss);
        
        const actions = document.createElement('div');
        actions.className='account-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className='icon-btn';
        editBtn.innerHTML='✏️';
        editBtn.title='Sửa';
        editBtn.addEventListener('click', (e)=>{
          e.stopPropagation();
          openEditModal(idx);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className='icon-btn delete';
        deleteBtn.innerHTML='🗑️';
        deleteBtn.title='Xóa';
        deleteBtn.addEventListener('click', (e)=>{
          e.stopPropagation();
          openDeleteModal(idx);
        });
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        el.appendChild(av);
        el.appendChild(meta);
        el.appendChild(actions);
        accountListEl.appendChild(el);
      });
      
      if (accounts.length===0){
        accountListEl.innerHTML = '<div style="color:rgba(255,255,255,0.6);padding:24px;text-align:center;line-height:1.6">Chưa có tài khoản nào.<br><br>Click <strong>"Thêm tài khoản"</strong> để bắt đầu.</div>';
      }
    }

    function selectAccount(i){
      selectedIndex = i;
      const a = accounts[i];
      issuerLabel.textContent = a.issuer || 'Không rõ issuer';
      accountLabel.textContent = a.account || '';
      renderQR(a);
      updateCodeNow();
      renderList();
    }

    let qrObj = null;
    function renderQR(a){
      qrEl.innerHTML = '';
      const url = buildOtpauth({issuer:a.issuer,account:a.account||'',secret:a.secret});
      qrObj = new QRCode(qrEl, {text:url,width:120,height:120,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
    }

    // copy to clipboard
    document.getElementById('btnCopy').addEventListener('click', async ()=>{
      if (selectedIndex===null) return alert('Chọn tài khoản trước');
      const code = codeDisplay.textContent;
      if (code === '------' || code === 'ERR') return;
      await navigator.clipboard.writeText(code);
      const btn = document.getElementById('btnCopy');
      const orig = btn.textContent;
      btn.textContent = '✅ Đã copy!';
      setTimeout(()=>btn.textContent = orig, 2000);
    });

    // delete modal
    let deleteTargetIndex = null;
    function openDeleteModal(idx){
      deleteTargetIndex = idx;
      document.getElementById('deleteAccountName').textContent = accounts[idx].issuer || 'tài khoản này';
      document.getElementById('deleteModalBackdrop').classList.add('show');
    }
    
    document.getElementById('deleteModalCancel').addEventListener('click', ()=>{
      document.getElementById('deleteModalBackdrop').classList.remove('show');
      deleteTargetIndex = null;
    });
    
    document.getElementById('deleteModalConfirm').addEventListener('click', ()=>{
      if (deleteTargetIndex !== null){
        accounts.splice(deleteTargetIndex, 1);
        saveAccounts(accounts);
        if (selectedIndex === deleteTargetIndex) {
          selectedIndex = null;
          clearDetail();
        } else if (selectedIndex > deleteTargetIndex) {
          selectedIndex--;
        }
        renderList();
        document.getElementById('deleteModalBackdrop').classList.remove('show');
        deleteTargetIndex = null;
      }
    });

    // delete button in detail view
    document.getElementById('btnDelete').addEventListener('click', ()=>{
      if (selectedIndex===null) return alert('Chọn tài khoản trước');
      openDeleteModal(selectedIndex);
    });

    function clearDetail(){
      issuerLabel.textContent='Không có tài khoản nào';
      accountLabel.textContent='Chọn một tài khoản để xem mã';
      codeDisplay.textContent='------';
      qrEl.innerHTML='';
      countdownEl.textContent='--';
    }

    // edit
    document.getElementById('btnEdit').addEventListener('click', ()=>{
      if (selectedIndex===null) return alert('Chọn tài khoản trước');
      openEditModal(selectedIndex);
    });

    // add button
    document.getElementById('btnAdd').addEventListener('click', ()=>openModal('Thêm tài khoản'));

    // clear all modal
    document.getElementById('btnClear').addEventListener('click', ()=>{
      document.getElementById('clearAllModalBackdrop').classList.add('show');
    });

    document.getElementById('clearAllModalCancel').addEventListener('click', ()=>{
      document.getElementById('clearAllModalBackdrop').classList.remove('show');
    });

    document.getElementById('clearAllModalConfirm').addEventListener('click', ()=>{
      accounts = [];
      saveAccounts(accounts);
      renderList();
      clearDetail();
      document.getElementById('clearAllModalBackdrop').classList.remove('show');
    });

    // modal logic
    const modalBackdrop = document.getElementById('modalBackdrop');
    
    function openModal(title){
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('mName').value = '';
      document.getElementById('mSecret').value = '';
      modalBackdrop.classList.add('show');
      modalBackdrop.dataset.edit = '';
    }
    
    function openEditModal(idx){
      const account = accounts[idx];
      document.getElementById('modalTitle').textContent = 'Sửa tài khoản';
      document.getElementById('mName').value = account.issuer || '';
      document.getElementById('mSecret').value = account.secret || '';
      modalBackdrop.classList.add('show');
      modalBackdrop.dataset.edit = idx;
    }
    
    document.getElementById('modalCancel').addEventListener('click', ()=>{
      modalBackdrop.classList.remove('show');
      delete modalBackdrop.dataset.edit;
    });
    
    document.getElementById('modalSave').addEventListener('click', ()=>{
      const issuer = document.getElementById('mName').value.trim();
      const secret = document.getElementById('mSecret').value.trim();
      
      if (!issuer || !secret) return alert('Vui lòng nhập đầy đủ thông tin');
      
      const obj = {issuer: issuer, account: '', secret: secret};
      const ed = modalBackdrop.dataset.edit;
      
      if (ed !== '' && ed !== undefined){
        accounts[Number(ed)] = obj;
        if (selectedIndex === Number(ed)) {
          selectAccount(Number(ed));
        }
      } else {
        accounts.push(obj);
        selectAccount(accounts.length - 1);
      }
      
      saveAccounts(accounts);
      renderList();
      modalBackdrop.classList.remove('show');
    });

    // close modal on backdrop click
    modalBackdrop.addEventListener('click', (e)=>{
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('show');
      }
    });
    
    document.getElementById('deleteModalBackdrop').addEventListener('click', (e)=>{
      if (e.target === document.getElementById('deleteModalBackdrop')) {
        document.getElementById('deleteModalBackdrop').classList.remove('show');
      }
    });

    document.getElementById('clearAllModalBackdrop').addEventListener('click', (e)=>{
      if (e.target === document.getElementById('clearAllModalBackdrop')) {
        document.getElementById('clearAllModalBackdrop').classList.remove('show');
      }
    });

    // ======= Timer to update codes every second =======
    async function updateCodeNow(){
      if (selectedIndex===null){
        codeDisplay.textContent='------';
        countdownEl.textContent='--';
        return;
      }
      const a = accounts[selectedIndex];
      const period = 30;
      const now = Math.floor(Date.now()/1000);
      const rem = period - (now % period);
      countdownEl.textContent = `${rem}s`;
      const otp = await generateTOTP(a.secret, 6, period);
      codeDisplay.textContent = otp;
    }

    // global tick
    setInterval(async ()=>{
      if (selectedIndex!==null){
        const a = accounts[selectedIndex];
        const period = 30;
        const now = Math.floor(Date.now()/1000);
        const rem = period - (now % period);
        countdownEl.textContent = `${rem}s`;
        const otp = await generateTOTP(a.secret, 6, period);
        codeDisplay.textContent = otp;
      }
    }, 1000);

    // render initial
    renderList();
    if (accounts.length===0){
      accounts.push({issuer:'Demo Account',account:'',secret:'JBSWY3DPEHPK3PXP'});
      saveAccounts(accounts);
      renderList();
    }
    if (accounts.length>0) selectAccount(0);

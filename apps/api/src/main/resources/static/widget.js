(function(){"use strict";function S(e){return`
    /* Botão flutuante */
    .upvote-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: ${e};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      z-index: 99998;
      padding: 0;
    }

    .upvote-widget-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }

    .upvote-widget-btn svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    /* Painel de feedback */
    .upvote-widget-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 360px;
      max-height: 480px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(12px) scale(0.96);
      transition: opacity 0.25s ease, transform 0.25s ease;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .upvote-widget-panel.upvote-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* Cabeçalho */
    .upvote-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background-color: ${e};
      color: white;
      flex-shrink: 0;
    }

    .upvote-widget-header h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      line-height: 1.3;
    }

    .upvote-widget-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      line-height: 1;
      transition: background 0.15s ease;
      padding: 0;
      flex-shrink: 0;
    }

    .upvote-widget-close:hover {
      background: rgba(255, 255, 255, 0.35);
    }

    /* Corpo do painel */
    .upvote-widget-body {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      overflow-y: auto;
    }

    /* Área de texto */
    .upvote-widget-textarea {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      color: #1e293b;
      background: #f8fafc;
      resize: vertical;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
      outline: none;
    }

    .upvote-widget-textarea:focus {
      border-color: ${e};
      box-shadow: 0 0 0 3px ${e}22;
      background: #ffffff;
    }

    .upvote-widget-textarea::placeholder {
      color: #94a3b8;
    }

    /* Botão de enviar */
    .upvote-widget-submit {
      width: 100%;
      padding: 10px 16px;
      background-color: ${e};
      color: white;
      border: none;
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s ease, transform 0.1s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 42px;
    }

    .upvote-widget-submit:hover:not(:disabled) {
      opacity: 0.9;
    }

    .upvote-widget-submit:active:not(:disabled) {
      transform: scale(0.98);
    }

    .upvote-widget-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Spinner de loading */
    .upvote-widget-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: upvote-spin 0.6s linear infinite;
    }

    /* Texto de consentimento */
    .upvote-widget-consent {
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.4;
      margin: 0;
      padding: 0 4px;
    }

    /* Mensagem de sucesso */
    .upvote-widget-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px 20px;
      text-align: center;
    }

    .upvote-widget-success-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .upvote-widget-success-icon svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    .upvote-widget-success-text {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    /* Mensagem de erro */
    .upvote-widget-error {
      font-size: 13px;
      color: #ef4444;
      text-align: center;
      margin: 0;
      padding: 4px 0;
    }

    /* Pergunta de follow-up */
    .upvote-widget-followup-question {
      font-size: 14px;
      color: #334155;
      line-height: 1.5;
      margin: 0;
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 8px;
      border-left: 3px solid ${e};
    }

    /* Responsividade mobile */
    @media (max-width: 480px) {
      .upvote-widget-panel {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        max-height: 85vh;
        border-radius: 16px 16px 0 0;
        transform: translateY(100%);
      }

      .upvote-widget-panel.upvote-open {
        transform: translateY(0);
      }
    }

    /* Animação de rotação */
    @keyframes upvote-spin {
      to { transform: rotate(360deg); }
    }
  `}let E="";function $(e){var p;const a=e.tagName.toLowerCase(),r=(((p=e.textContent)==null?void 0:p.trim().substring(0,50))||e.getAttribute("aria-label")||e.getAttribute("title")||e.getAttribute("alt")||e.getAttribute("placeholder")||"").trim();return r?a==="button"||e.getAttribute("role")==="button"?`botão ${r}`:a==="a"?`link ${r}`:a==="input"||a==="textarea"||a==="select"?`campo ${e.getAttribute("aria-label")||e.getAttribute("placeholder")||H(e)||r}`:a==="img"?`imagem ${r}`:r:""}function H(e){const a=e.getAttribute("id");if(a){const p=document.querySelector(`label[for="${a}"]`);if(p!=null&&p.textContent)return p.textContent.trim().substring(0,50)}const r=e.closest("label");return r!=null&&r.textContent?r.textContent.trim().substring(0,50):""}function M(){document.addEventListener("click",e=>{const a=e.target;if(!a||a.closest("[data-upvote-widget]"))return;const r=$(a);r&&(E=r)},!0)}function U(){return E}function j(){return window.innerWidth<768?"mobile":"desktop"}function F(e){return{pageUrl:window.location.href,pageTitle:document.title,triggerType:e,lastInteraction:U(),deviceType:j()}}(function(){const e=document.currentScript;if(!e)return;const a=e.getAttribute("data-api-key"),r=e.getAttribute("data-color")||"#6366f1",p=e.getAttribute("data-base-url")||"https://api.upvote.com",k=e.getAttribute("data-trigger")||"button";if(!a){console.error("[Upvote Widget] Atributo data-api-key é obrigatório");return}const I=a;M();const T=document.createElement("style");T.textContent=S(r),document.head.appendChild(T);let f=!1,v=!1,A=k==="always"?"always_visible":"button",u,s;const P=`
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  `,K=`
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
  `,m=document.createElement("button");m.className="upvote-widget-btn",m.setAttribute("aria-label","Enviar feedback"),m.setAttribute("data-upvote-widget","true"),m.innerHTML=P,document.body.appendChild(m),u=document.createElement("div"),u.className="upvote-widget-panel",u.setAttribute("data-upvote-widget","true");const w=document.createElement("div");w.className="upvote-widget-header";const L=document.createElement("h3");L.textContent="Feedback",w.appendChild(L);const b=document.createElement("button");b.className="upvote-widget-close",b.setAttribute("aria-label","Fechar"),b.innerHTML="&times;",b.addEventListener("click",x),w.appendChild(b),u.appendChild(w),s=document.createElement("div"),s.className="upvote-widget-body",u.appendChild(s),document.body.appendChild(u),C();function h(t){f||(f=!0,t&&(A=t),C(),u.classList.add("upvote-open"))}function x(){f&&(f=!1,u.classList.remove("upvote-open"),setTimeout(()=>{f||(v=!1,C())},300))}document.addEventListener("keydown",t=>{t.key==="Escape"&&x()}),m.addEventListener("click",()=>{f?x():h("button")});function C(){s.innerHTML="";const t=document.createElement("textarea");t.className="upvote-widget-textarea",t.placeholder="Descreva seu feedback, bug ou sugestão...",t.setAttribute("rows","4");const n=document.createElement("p");n.className="upvote-widget-error",n.style.display="none";const o=document.createElement("button");o.className="upvote-widget-submit",o.textContent="Enviar feedback",o.addEventListener("click",()=>N(t,o,n)),t.addEventListener("keydown",d=>{(d.ctrlKey||d.metaKey)&&d.key==="Enter"&&N(t,o,n)});const i=document.createElement("p");i.className="upvote-widget-consent",i.textContent="Ao enviar, você concorda com nossa política de feedback",s.appendChild(t),s.appendChild(n),s.appendChild(o),s.appendChild(i),setTimeout(()=>t.focus(),100)}async function N(t,n,o){const i=t.value.trim();if(!i){t.style.borderColor="#ef4444",t.focus(),setTimeout(()=>{t.style.borderColor=""},2e3);return}if(v)return;v=!0,n.disabled=!0,n.innerHTML='<span class="upvote-widget-spinner"></span> Enviando...',o.style.display="none";const d=F(A),c={message:i,...d};try{const l=await fetch(`${p}/api/widget/feedback`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":I},body:JSON.stringify(c)});if(!l.ok)throw new Error(`HTTP ${l.status}`);const g=await l.json();g.followUpQuestion&&g.feedbackId?O(g.followUpQuestion,g.feedbackId):y()}catch{v=!1,n.disabled=!1,n.textContent="Enviar feedback",o.textContent="Erro ao enviar. Tente novamente.",o.style.display="block"}}function O(t,n){s.innerHTML="";const o=document.createElement("p");o.className="upvote-widget-followup-question",o.textContent=t;const i=document.createElement("textarea");i.className="upvote-widget-textarea",i.placeholder="Sua resposta (opcional)...",i.setAttribute("rows","3");const d=document.createElement("p");d.className="upvote-widget-error",d.style.display="none";const c=document.createElement("button");c.className="upvote-widget-submit",c.textContent="Enviar resposta",c.addEventListener("click",()=>z(i,c,d,n)),i.addEventListener("keydown",g=>{(g.ctrlKey||g.metaKey)&&g.key==="Enter"&&z(i,c,d,n)});const l=document.createElement("button");l.className="upvote-widget-submit",l.style.background="transparent",l.style.color="#64748b",l.style.fontWeight="400",l.textContent="Pular",l.addEventListener("click",()=>{y()}),s.appendChild(o),s.appendChild(i),s.appendChild(d),s.appendChild(c),s.appendChild(l),setTimeout(()=>i.focus(),100)}async function z(t,n,o,i){const d=t.value.trim();if(!d){y();return}n.disabled=!0,n.innerHTML='<span class="upvote-widget-spinner"></span> Enviando...',o.style.display="none";try{const c=await fetch(`${p}/api/widget/feedback/${i}/follow-up`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({answer:d})});if(!c.ok)throw new Error(`HTTP ${c.status}`);y()}catch{n.disabled=!1,n.textContent="Enviar resposta",o.textContent="Erro ao enviar. Tente novamente.",o.style.display="block"}}function y(){s.innerHTML="";const t=document.createElement("div");t.className="upvote-widget-success";const n=document.createElement("div");n.className="upvote-widget-success-icon",n.innerHTML=K;const o=document.createElement("p");o.className="upvote-widget-success-text",o.textContent="Feedback enviado! Obrigado.",t.appendChild(n),t.appendChild(o),s.appendChild(t),setTimeout(()=>{x()},2e3)}window.UpvoteWidget={open:()=>h("event"),close:()=>x()},k==="always"&&(document.readyState==="complete"||document.readyState==="interactive"?setTimeout(()=>h("always_visible"),500):window.addEventListener("DOMContentLoaded",()=>{setTimeout(()=>h("always_visible"),500)}))})()})();

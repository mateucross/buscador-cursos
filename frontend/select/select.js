document.addEventListener('DOMContentLoaded', () => {
    const detalhesDiv = document.getElementById('detalhes-do-curso');
    const loadingSpinner = document.querySelector('.loading-spinner-container');

    // Variável centralizada para o IP
    const BASE_IP = "localhost";
    const ENDPOINT_LOCAL_SELECT = `http://${BASE_IP}:8000/select`;

    function gerarEstrelas(rating ) {
        const maxEstrelas = 5;
        let estrelasHtml = '';
        const ratingNumerico = parseFloat(rating) || 0;
        const estrelasCheias = Math.floor(ratingNumerico);
        for (let i = 0; i < estrelasCheias; i++) estrelasHtml += '★';
        for (let i = estrelasCheias; i < maxEstrelas; i++) estrelasHtml += '☆';
        return estrelasHtml;
    }

    async function buscarErenderizarDetalhes() {
        const urlParams = new URLSearchParams(window.location.search);
        const cursoId = urlParams.get('id');

        loadingSpinner.style.display = 'flex';
        detalhesDiv.innerHTML = '';

        try {
            const response = await fetch(ENDPOINT_LOCAL_SELECT, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id: cursoId })
            });
            if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);

            const data = await response.json();
            const courseData = data.responses?.[0];
            if (!courseData?.message?.order?.items?.[0]) {
                detalhesDiv.innerHTML = `<p class="error-message">Não foi possível carregar os detalhes do curso.</p>`;
                return;
            }

            const item = courseData.message.order.items[0];
            const provider = courseData.message.order.provider;

            // Extração de dados (sem alteração)
            const courseName = item.descriptor?.name || "Curso sem nome";
            const longDesc = item.descriptor?.long_desc || "";
            const shortDesc = item.descriptor?.short_desc || "";
            const courseImage = item.descriptor?.images?.[0]?.url || "https://via.placeholder.com/600x400?text=Imagem+Indisponível";
            const courseLink = item.descriptor?.media?.[0]?.url || "#";
            const priceValue = item.price?.value || "0";
            const priceCurrency = item.price?.currency || "BRL";
            const displayCurrency = priceCurrency === "BRL" ? "R$" : priceCurrency;
            const priceText = (priceValue === "0.00" || priceValue === "0" ) ? "Grátis" : `${displayCurrency} ${priceValue.replace('.', ',')}`;
            const rating = item.rating || "0";
            const estrelasHtml = gerarEstrelas(rating);
            const providerName = provider.descriptor?.name || "Provedor Desconhecido";
            const providerLogo = provider.descriptor?.images?.[0]?.url;
            const creatorName = item.creator?.descriptor?.name || "Instrutor não informado";
            const creatorImage = item.creator?.descriptor?.images?.[0]?.url;
            const creatorBio = item.creator?.descriptor?.short_desc || "";
            const addOns = item.add_ons || [];
            
            let nivel = "", idioma = "", duracao = "", prerequisitos = [], objetivoAprendizagem = "";
            const metadataTag = item.tags?.find(tag => tag.descriptor?.code === "content-metadata");
            if (metadataTag?.list) {
                metadataTag.list.forEach(meta => {
                    switch(meta.descriptor?.code) {
                        case "learner-level": nivel = meta.value; break;
                        case "lang-code": idioma = meta.value?.replace("pt-BR", "Português"); break;
                        case "course-duration": duracao = meta.value?.replace("PT", "").replace("H", "h"); break;
                        case "prerequisite": prerequisitos.push(meta.value); break;
                        case "learning-objective": objetivoAprendizagem = meta.value; break;
                    }
                });
            }
            
            let actionButtonHtml = '';
            let modalHtml = '';

            if (addOns.length > 0) {
                actionButtonHtml = `<button id="open-modal-btn" class="access-button-big">Inscreva-se Agora</button>`;
                
                // --- INÍCIO DA MODIFICAÇÃO ---
                // Adicionados os novos campos ao formulário
                modalHtml = `
                    <div id="enrollment-modal" class="modal">
                        <div class="modal-content">
                            <span class="close-button">&times;</span>
                            <div class="enrollment-section">
                                <h4>Formulário de Inscrição</h4>
                                <div class="turma-selector-group">
                                    <label for="turma-select">Selecione a turma:</label>
                                    <select id="turma-select">${addOns.map(t => `<option value="${t.id}">${t.descriptor.name}</option>`).join('')}</select>
                                </div>
                                <div class="enrollment-form">
                                    <div class="form-group full-width"><label for="nome">Nome Completo</label><input type="text" id="nome" required></div>
                                    <div class="form-group"><label for="email">Email</label><input type="email" id="email" required></div>
                                    <div class="form-group"><label for="telefone">Telefone</label><input type="tel" id="telefone" required></div>
                                    <div class="form-group full-width"><label for="endereco">Endereço</label><input type="text" id="endereco" required></div>
                                    <div class="form-group"><label for="idade">Idade</label><input type="number" id="idade" required></div>
                                    <div class="form-group"><label for="genero">Gênero</label><input type="text" id="genero" required></div>
                                    <div class="form-group full-width"><label for="profissao">Profissão</label><input type="text" id="profissao" required></div>
                                </div>
                            </div>
                            <button class="access-button-big confirm-enrollment-btn">Iniciar Inscrição</button>
                        </div>
                    </div>`;
                // --- FIM DA MODIFICAÇÃO ---

            } else if (courseLink !== "#") {
                actionButtonHtml = `<a href="${courseLink}" target="_blank" class="access-button-big">Acessar Curso</a>`;
            }

            // O restante do código para renderizar a página permanece o mesmo
            detalhesDiv.innerHTML = `
                <div class="course-layout">
                    <!-- Coluna Principal -->
                    <div class="course-main-column">
                        <h1>${courseName}</h1>
                        <div class="provider-info">
                            <img src="${providerLogo}" alt="${providerName}" class="provider-logo">
                            <span class="provider-name">Oferecido por ${providerName}</span>
                        </div>
                        <p class="short-desc">${shortDesc}</p>

                        ${objetivoAprendizagem ? `<div class="course-section"><h4>O que você vai aprender</h4><p>${objetivoAprendizagem}</p></div>` : ""}
                        ${longDesc ? `<div class="course-section"><h4>Sobre o curso</h4><p>${longDesc}</p></div>` : ""}
                        ${prerequisitos.length > 0 ? `<div class="course-section"><h4>Pré-requisitos</h4><ul>${prerequisitos.map(p => `<li>${p}</li>`).join('')}</ul></div>` : ""}
                        
                        ${creatorName !== "Instrutor não informado" ? `
                            <div class="course-section">
                                <h4>Sobre o Instrutor</h4>
                                <div class="creator-info">
                                    <img src="${creatorImage}" alt="${creatorName}">
                                    <div>
                                        <h5>${creatorName}</h5>
                                        <p>${creatorBio}</p>
                                    </div>
                                </div>
                            </div>` : ""}
                    </div>

                    <!-- Coluna Lateral (Sidebar) -->
                    <div class="course-sidebar">
                        <div class="action-card">
                            <img src="${courseImage}" alt="${courseName}" class="action-card-image">
                            <div class="action-card-body">
                                <div class="price ${priceValue === '0' ? 'free' : ''}">${priceText}</div>
                                <div class="rating"><span>${estrelasHtml}</span> (${rating})</div>
                                ${actionButtonHtml}
                                <ul class="course-meta">
                                    ${nivel ? `<li><i class="fas fa-layer-group"></i> Nível ${nivel}</li>` : ""}
                                    ${duracao ? `<li><i class="far fa-clock"></i> Duração de ${duracao}</li>` : ""}
                                    ${idioma ? `<li><i class="fas fa-globe"></i> Idioma ${idioma}</li>` : ""}
                                    <li><i class="fas fa-certificate"></i> Certificado de conclusão</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                ${modalHtml}
            `;

            if (addOns.length > 0) {
                const modal = document.getElementById('enrollment-modal');
                const openBtn = document.getElementById('open-modal-btn');
                const closeBtn = modal.querySelector('.close-button');
                const confirmButton = modal.querySelector('.confirm-enrollment-btn');

                openBtn.addEventListener('click', () => modal.classList.add('show'));
                closeBtn.addEventListener('click', () => modal.classList.remove('show'));
                window.addEventListener('click', (event) => {
                    if (event.target === modal) modal.classList.remove('show');
                });
                
                confirmButton.addEventListener('click', () => {
                    // Você pode adicionar a lógica para coletar os novos campos aqui se precisar
                    // const endereco = document.getElementById('endereco').value;
                    // const idade = document.getElementById('idade').value;
                    // etc...
                    
                    window.location.href = `../init/init.html?id=${cursoId}`;
                });
            }

        } catch (error) {
            console.error('Erro:', error);
            detalhesDiv.innerHTML = `<p class="error-message">Ocorreu um erro ao buscar os detalhes do curso: ${error.message}.</p>`;
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    buscarErenderizarDetalhes();
});

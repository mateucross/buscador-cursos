let globalOrderId = null;
const BASE_IP = "localhost";


document.addEventListener('DOMContentLoaded', async () => {
    const courseDetailsContainer = document.getElementById('course-details');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Variável centralizada para o IP
    const ENDPOINT_LOCAL_STATUS = `http://${BASE_IP}:8000/status`;


    const urlParams = new URLSearchParams(window.location.search );
    globalOrderId = urlParams.get("order_id");

    if (!globalOrderId) {
        loadingSpinner.style.display = 'none';
        courseDetailsContainer.innerHTML = `<p class="error-message">ID da matrícula não encontrado na URL.</p>`;
        return;
    }

    loadingSpinner.style.display = 'flex';
    courseDetailsContainer.innerHTML = '';

    try {
        const response = await fetch(ENDPOINT_LOCAL_STATUS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: globalOrderId })
        });
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);

        const data = await response.json();
        const order = data?.responses?.[0]?.message?.order;

        if (!order) {
            courseDetailsContainer.innerHTML = `<p class="error-message">Não foi possível carregar os dados do curso.</p>`;
            return;
        }
        renderCoursePage(order);

    } catch (error) {
        console.error('Erro:', error);
        courseDetailsContainer.innerHTML = `<p class="error-message">Ocorreu um erro: ${error.message}.</p>`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
});

function renderCoursePage(order) {
    const courseDetailsContainer = document.getElementById('course-details');
    const course = order.items?.[0];
    const fulfillment = order.fulfillments?.[0];

    const sidebarHtml = renderSidebar(course, fulfillment, order);
    const mainContentHtml = renderMainContent(fulfillment);

    courseDetailsContainer.innerHTML = mainContentHtml + sidebarHtml;

    document.querySelectorAll('.lesson-item-header').forEach(header => {
        header.addEventListener('click', () => {
            const lessonItem = header.parentElement;
            const lessonIndex = parseInt(lessonItem.dataset.lessonIndex, 10);
            const stop = fulfillment?.stops[lessonIndex];
            toggleLessonContent(lessonItem, stop);
        });
    });

    document.getElementById('submit-rating-button').addEventListener('click', submitRating);
}

function renderSidebar(course, fulfillment, order) {
    const courseName = course?.descriptor?.name || 'Curso não disponível';
    const studentName = fulfillment?.customer?.person?.name || 'Aluno não informado';
    const status = fulfillment?.state?.descriptor?.name || 'Não disponível';
    const statusClass = `status-${status.toLowerCase().replace(/[\s_]+/g, '-')}`;
    const updatedAt = fulfillment?.state?.updated_at ? new Date(fulfillment.state.updated_at).toLocaleString('pt-BR') : 'N/D';

    return `
        <aside class="course-sidebar">
            <div class="course-info-card">
                <h1>${courseName}</h1>
                <div class="info-item"><strong>Aluno:</strong> ${studentName}</div>
                <div class="info-item"><strong>Status:</strong> <span id="enrollment-status" class="status-badge ${statusClass}">${status}</span></div>
                <div class="info-item"><strong>Última Atualização:</strong> ${updatedAt}</div>
                <div class="info-item"><strong>ID da Matrícula:</strong> ${order.id}</div>
                <div class="course-actions">
                    <button class="action-button" onclick="openStatusPopup()"><i class="fas fa-info-circle"></i> Status</button>
                    <button class="action-button" onclick="openUpdatePopup()"><i class="fas fa-check-circle"></i> Atualizar</button>
                    <button class="action-button" onclick="openTrackPopup()"><i class="fas fa-chart-line"></i> Progresso</button>
                    <button class="action-button" onclick="openRatingPopup()"><i class="fas fa-star"></i> Avaliar</button>
                    <button class="action-button" onclick="openSupportPopup()"><i class="fas fa-headset"></i> Suporte</button>
                    <button class="action-button danger" onclick="openCancelPopup()"><i class="fas fa-times-circle"></i> Cancelar</button>
                </div>
            </div>
        </aside>
    `;
}

function renderMainContent(fulfillment) {
    const stops = fulfillment?.stops || [];
    let lessonsHtml = stops.map((stop, index) => {
        const lessonName = stop.instructions?.name || `Aula ${index + 1}`;
        return `
            <li class="lesson-item" data-lesson-index="${index}">
                <div class="lesson-item-header">
                    <h3>${lessonName}</h3>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="lesson-content-expanded" style="display: none;"></div>
            </li>
        `;
    }).join('');

    return `
        <div class="course-content-main">
            <h2>Conteúdo do Curso</h2>
            <ul class="lesson-list">${lessonsHtml}</ul>
        </div>
    `;
}

let currentlyOpenLesson = null;

function toggleLessonContent(lessonItem, stop) {
    const contentDiv = lessonItem.querySelector('.lesson-content-expanded');
    const isOpen = lessonItem.classList.contains('open');

    if (currentlyOpenLesson && currentlyOpenLesson !== lessonItem) {
        currentlyOpenLesson.classList.remove('open');
        currentlyOpenLesson.querySelector('.lesson-content-expanded').style.display = 'none';
    }

    if (isOpen) {
        lessonItem.classList.remove('open');
        contentDiv.style.display = 'none';
        currentlyOpenLesson = null;
    } else {
        const lessonName = stop?.instructions?.name || 'Aula sem nome';
        const lessonDesc = stop?.instructions?.long_desc || 'Descrição não disponível.';
        const media = stop?.instructions?.media?.[0];
        let mediaContent = '';

        if (media) {
            const url = media.url;
            const mimetype = media.mimetype || "";
            if (mimetype.includes('video')) {
                const videoId = url.includes('watch?v=') ? new URL(url).searchParams.get('v') : url.split('/').pop();
                const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                mediaContent = `<div class="video-player"><iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>`;
            } else if (mimetype.includes('pdf' )) {
                mediaContent = `<a href="${url}" target="_blank" class="action-button primary">Baixar Material (PDF)</a>`;
            }
        }

        contentDiv.innerHTML = `<h4>${lessonName}</h4><p>${lessonDesc}</p>${mediaContent}`;
        contentDiv.style.display = 'block';
        lessonItem.classList.add('open');
        currentlyOpenLesson = lessonItem;
    }
}

// --- Funções de Pop-up (sem alterações) ---
function openStatusPopup() {
    openPopup('status-popup-overlay');
    const contentDiv = document.getElementById('status-content');
    contentDiv.innerHTML = `<div class="loading-spinner"></div>`;
    fetch(`http://${BASE_IP}:8000/status`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ order_id: globalOrderId }  ) 
    })
    .then(res => {
        if (!res.ok) throw new Error(`Erro na requisição: ${res.status}`);
        return res.json();
    })
    .then(data => {
        const order = data.responses?.[0]?.message?.order;
        if (!order) {
            contentDiv.innerHTML = `<p class="error-message">Não foi possível carregar os detalhes do status.</p>`;
            return;
        }

        const payment = order.payments?.[0] || {};
        const fulfillment = order.fulfillments?.[0] || {};
        const customer = fulfillment.customer?.person || {};
        const contact = fulfillment.customer?.contact || {};

        contentDiv.innerHTML = `
            <h2><i class="fas fa-info-circle"></i> Detalhes da Matrícula</h2>
            <ul class="status-info-list">
                <li><strong>ID da Matrícula:</strong> <span>${order.id || 'N/D'}</span></li>
                <li><strong>Status do Curso:</strong> <span>${fulfillment.state?.descriptor?.name || 'N/D'}</span></li>
                <li><strong>Aluno:</strong> <span>${customer.name || 'N/D'}</span></li>
                <li><strong>Email:</strong> <span>${contact.email || 'N/D'}</span></li>
                <li><strong>Status do Pagamento:</strong> <span>${payment.status || 'N/D'}</span></li>
                <li><strong>Endereço de Cobrança:</strong> <span>${order.billing?.address || 'N/D'}</span></li>
                <li><strong>ID da Transação:</strong> <span>${data.context?.transaction_id || 'N/D'}</span></li>
            </ul>
        `;
    })
    .catch(err => {
        contentDiv.innerHTML = `<p class="error-message">${err.message}</p>`;
    });
}

function openPopup(id) { document.getElementById(id).style.display = 'flex'; }
function closePopup(id) { document.getElementById(id).style.display = 'none'; }

function openRatingPopup() {
    openPopup('rating-popup-overlay');
    document.getElementById('rating-result').innerHTML = '';
    const submitButton = document.getElementById('submit-rating-button');
    submitButton.disabled = false;
    submitButton.textContent = 'Enviar Avaliação';
}

async function submitRating() {
    const resultDiv = document.getElementById('rating-result');
    const submitButton = document.getElementById('submit-rating-button');
    const ratingValue = document.querySelector('input[name="rating"]:checked')?.value;
    if (!ratingValue) {
        resultDiv.innerHTML = `<p class="error-message">Por favor, selecione uma avaliação de 1 a 5 estrelas.</p>`;
        return;
    }
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    resultDiv.innerHTML = `<div class="loading-spinner" style="width: 30px; height: 30px; border-width: 4px; margin: 10px auto;"></div>`;
    try {
        const response = await fetch(`http://${BASE_IP}:8000/rating`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: globalOrderId, rating: ratingValue }  ) });
        if (!response.ok) throw new Error(`Falha na comunicação: ${response.status}`);
        const data = await response.json();
        const feedbackUrl = data.responses?.[0]?.message?.feedback_form?.form?.url;
        let successHtml = `<p class="success-message">✅ Sua avaliação de ${ratingValue} estrelas foi enviada com sucesso!</p>`;
        if (feedbackUrl) {
            successHtml += `<p>Se desejar, forneça um feedback mais detalhado.</p><a href="${feedbackUrl}" target="_blank" class="action-button primary" style="margin-top: 10px;">Abrir Formulário</a>`;
        }
        resultDiv.innerHTML = successHtml;
    } catch (err) {
        resultDiv.innerHTML = `<p class="error-message">❌ Ops! Não foi possível enviar sua avaliação. (${err.message})</p>`;
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar Avaliação';
    }
}

function openSupportPopup() {
    openPopup('support-popup-overlay');
    const contentDiv = document.getElementById('support-content');
    contentDiv.innerHTML = `<div class="loading-spinner"></div>`;
    fetch(`http://${BASE_IP}:8000/support`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: globalOrderId }  ) })
        .then(res => res.json()).then(data => {
            const support = data.responses?.[0]?.message?.support;
            contentDiv.innerHTML = `<h2><i class="fas fa-headset"></i> Suporte</h2><p><strong>Telefone:</strong> ${support?.phone || "N/D"}</p><p><strong>Email:</strong> ${support?.email || "N/D"}</p>${support?.url ? `<a href="${support.url}" target="_blank" class="action-button primary">Acessar Suporte</a>` : ''}`;
        }).catch(err => contentDiv.innerHTML = `<p class="error-message">${err.message}</p>`);
}

function openCancelPopup() {
    openPopup('cancel-popup-overlay');
    const contentDiv = document.getElementById('cancel-content');
    contentDiv.innerHTML = `<h2><i class="fas fa-exclamation-triangle"></i> Confirmar Cancelamento</h2><p>Você tem certeza que deseja cancelar sua matrícula?</p><div class="popup-confirmation-buttons"><button class="action-button" onclick="closePopup('cancel-popup-overlay')">Não</button><button class="action-button danger" onclick="proceedWithCancellation()">Sim, cancelar</button></div>`;
}

function proceedWithCancellation() {
    const contentDiv = document.getElementById('cancel-content');
    contentDiv.innerHTML = `<div class="loading-spinner"></div>`;
    fetch(`http://${BASE_IP}:8000/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: globalOrderId }  ) })
        .then(res => res.json()).then(data => {
            const order = data.responses?.[0]?.message?.order;
            contentDiv.innerHTML = `<div data-cancellation-complete="true"><h2><i class="fas fa-check-circle"></i> Matrícula Cancelada</h2><p>A matrícula para o curso <strong>${order?.items?.[0]?.descriptor?.name}</strong> foi cancelada.</p><p style="font-weight: 600; margin-top: 15px;">Clique no 'X' para voltar à lista de cursos.</p></div>`;
            const statusBadge = document.getElementById('enrollment-status');
            statusBadge.textContent = order?.fulfillments?.[0]?.state?.descriptor?.name || 'Cancelado';
            statusBadge.className = `status-badge status-curso-cancelado`;
        }).catch(err => contentDiv.innerHTML = `<p class="error-message">${err.message}</p>`);
}

function closeCancelPopup() {
    const isComplete = document.querySelector('#cancel-content [data-cancellation-complete="true"]');
    if (isComplete) {
        window.location.href = "../index.html";
    } else {
        closePopup('cancel-popup-overlay');
    }
}

function openTrackPopup() {
    openPopup('track-popup-overlay');
    const contentDiv = document.getElementById('track-content');
    contentDiv.innerHTML = `<div class="loading-spinner"></div>`;
    fetch(`http://${BASE_IP}:8000/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: globalOrderId }  ) })
        .then(res => res.json()).then(data => {
            const tracking = data.responses?.[0]?.message?.tracking;
            const progress = tracking?.status === 'completed' ? 100 : (tracking?.status === 'active' ? 100 : 0);
            contentDiv.innerHTML = `<h2><i class="fas fa-chart-line"></i> Progresso</h2><p><strong>Status:</strong> ${tracking?.status || "N/D"}</p><div class="progress-container"><div class="progress-bar" style="width: ${progress}%;">${progress}%</div></div>${tracking?.url ? `<a href="${tracking.url}" target="_blank" class="action-button primary">Ver Progresso</a>` : ''}`;
        }).catch(err => contentDiv.innerHTML = `<p class="error-message">${err.message}</p>`);
}

function openUpdatePopup() {
    openPopup('update-popup-overlay');
    const contentDiv = document.getElementById('update-content');
    contentDiv.innerHTML = `<div class="loading-spinner"></div>`;
    fetch(`http://${BASE_IP}:8000/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: globalOrderId }  ) })
        .then(res => res.json()).then(data => {
            const order = data.responses?.[0]?.message?.order;
            const newStatus = order?.fulfillments?.[0]?.state?.descriptor?.name || 'Não disponível';
            contentDiv.innerHTML = `<h2><i class="fas fa-check-circle"></i> Progresso Atualizado</h2><p>O status do curso foi atualizado para <strong>${newStatus}</strong>.</p>`;
            const statusBadge = document.getElementById('enrollment-status');
            statusBadge.textContent = newStatus;
            statusBadge.className = `status-badge status-${newStatus.toLowerCase().replace(/[\s_]+/g, '-')}`;
        }).catch(err => contentDiv.innerHTML = `<p class="error-message">${err.message}</p>`);
}

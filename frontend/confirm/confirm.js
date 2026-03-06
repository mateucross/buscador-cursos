document.addEventListener('DOMContentLoaded', async () => {
    const resultadoDiv = document.getElementById('resultado-confirmacao');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Variável centralizada para o IP
    const BASE_IP = "localhost";
    const ENDPOINT_LOCAL_CONFIRM = `http://${BASE_IP}:8000/confirm`;

    const urlParams = new URLSearchParams(window.location.search );
    const cursoId = urlParams.get("id");

    loadingSpinner.style.display = 'flex';
    resultadoDiv.style.display = 'none';

    try {
        const response = await fetch(ENDPOINT_LOCAL_CONFIRM, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cursoId })
        });
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);

        const data = await response.json();
        const order = data?.responses?.[0]?.message?.order;

        if (!order) {
            resultadoDiv.innerHTML = `<p class="error-message">Não foi possível confirmar a matrícula.</p>`;
            return;
        }

        const item = order.items?.[0];
        const courseName = item?.descriptor?.name || "Curso não informado";
        const courseImage = item?.descriptor?.images?.[0]?.url || "https://via.placeholder.com/120x80?text=Curso";
        const providerName = order.provider?.descriptor?.name || "Provedor não informado";
        const orderId = order.id;

        resultadoDiv.innerHTML = `
            <div class="confirmation-header" style="text-align: center;">
                <h1><i class="fas fa-check-circle" style="color: var(--success-color );"></i> Matrícula Realizada com Sucesso!</h1>
                <p>Você agora tem acesso completo ao curso.</p>
            </div>

            <div class="info-section">
                <h4><i class="fas fa-book-open"></i> Detalhes do Curso</h4>
                <div class="course-summary">
                    <img src="${courseImage}" alt="${courseName}">
                    <div class="course-summary-details">
                        <h5>${courseName}</h5>
                        <p>Oferecido por: <strong>${providerName}</strong></p>
                    </div>
                </div>
            </div>

            <div class="confirmation-footer">
                <button id="view-course-btn" class="action-button primary" style="padding: 12px 30px; font-size: 1.1rem;">
                    <i class="fas fa-eye"></i> Ver Curso
                </button>
            </div>
        `;

        document.getElementById('view-course-btn').addEventListener('click', () => {
            // Redireciona para a página de status com o order_id
            window.location.href = `../status/status.html?order_id=${orderId}`;
        });

        resultadoDiv.style.display = 'block';

    } catch (error) {
        console.error('Erro:', error);
        resultadoDiv.innerHTML = `<p class="error-message">Ocorreu um erro: ${error.message}.</p>`;
        resultadoDiv.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }
});

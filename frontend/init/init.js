document.addEventListener('DOMContentLoaded', async () => {
    const resultadoDiv = document.getElementById('resultado-confirmacao');
    const loadingSpinner = document.querySelector('.loading-spinner-container');

    // Variável centralizada para o IP
    const BASE_IP = "localhost";
    const ENDPOINT_LOCAL_INIT = `http://${BASE_IP}:8000/init`;

    const urlParams = new URLSearchParams(window.location.search );
    const cursoId = urlParams.get('id');

    loadingSpinner.style.display = 'flex';
    resultadoDiv.innerHTML = '';

    try {
        const response = await fetch(ENDPOINT_LOCAL_INIT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cursoId })
        });
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);

        const data = await response.json();
        const apiResponse = data?.responses?.[0];
        const order = apiResponse?.message?.order;
        const context = apiResponse?.context;

        if (!order) {
            resultadoDiv.innerHTML = `<p class="error-message">Não foi possível carregar os dados para confirmação.</p>`;
            return;
        }

        // Extração de dados da API
        const item = order.items?.[0];
        const provider = order.provider;
        const fulfillment = order.fulfillments?.[0];
        const customer = fulfillment?.customer;
        const billing = order.billing;
        const payment = order.payments?.[0];

        const courseName = item?.descriptor?.name || "Curso não informado";
        const courseImage = item?.descriptor?.images?.[0]?.url || "https://via.placeholder.com/120x80?text=Curso";
        const providerName = provider?.descriptor?.name || "Provedor não informado";
        const turma = item?.["add-ons"]?.[0]?.descriptor?.name || "Não informada";
        
        const customerName = customer?.person?.name || 'Não informado';
        const customerAge = customer?.person?.age || 'Não informada';
        const customerEmail = customer?.contact?.email || 'Não informado';
        const customerPhone = customer?.contact?.phone || 'Não informado';
        const customerGender = customer?.person?.gender || 'Não informado';
        
        const professionTag = customer?.person?.tags?.find(tag => tag.descriptor?.code === "occupation" );
        const profession = professionTag?.value || 'Não informada';

        const billingAddress = billing?.address || 'Não informado';
        const transactionId = context?.transaction_id || 'Não informado';
        const paymentStatus = payment?.status || 'Não informado';
        const paymentLink = payment?.url || '#';

        // Montagem do HTML com a nova estética
        resultadoDiv.innerHTML = `
            <div class="confirmation-layout">
                <div class="confirmation-header">
                    <h1>Revise sua Matrícula</h1>
                    <p>Confira todos os detalhes antes de confirmar sua inscrição no curso.</p>
                </div>

                <!-- Resumo do Curso -->
                <div class="info-section">
                    <h4><i class="fas fa-book-open"></i> Resumo do Curso</h4>
                    <div class="course-summary">
                        <img src="${courseImage}" alt="${courseName}">
                        <div class="course-summary-details">
                            <h5>${courseName}</h5>
                            <p>Oferecido por: <strong>${providerName}</strong></p>
                            <p>Turma: <strong>${turma}</strong></p>
                        </div>
                    </div>
                </div>

                <!-- Dados do Aluno -->
                <div class="info-section">
                    <h4><i class="fas fa-user"></i> Dados do Aluno</h4>
                    <div class="info-grid">
                        <div class="info-item"><strong>Nome:</strong><span>${customerName}</span></div>
                        <div class="info-item"><strong>Email:</strong><span>${customerEmail}</span></div>
                        <div class="info-item"><strong>Telefone:</strong><span>${customerPhone}</span></div>
                        <div class="info-item"><strong>Idade:</strong><span>${customerAge}</span></div>
                        <div class="info-item"><strong>Gênero:</strong><span>${customerGender}</span></div>
                        <div class="info-item"><strong>Profissão:</strong><span>${profession}</span></div>
                    </div>
                </div>

                <!-- Detalhes da Transação -->
                <div class="info-section">
                    <h4><i class="fas fa-receipt"></i> Detalhes da Transação</h4>
                    <div class="info-grid">
                        <div class="info-item"><strong>Endereço de Cobrança:</strong><span>${billingAddress}</span></div>
                        <div class="info-item"><strong>ID da Transação:</strong><span>${transactionId}</span></div>
                        <div class="info-item"><strong>Status do Pagamento:</strong><span>${paymentStatus}</span></div>
                        <div class="info-item"><strong>Link de Pagamento:</strong><a href="${paymentLink}" target="_blank">Acessar Link</a></div>
                    </div>
                </div>

                <div class="confirmation-footer">
                    <button id="confirmar-btn" class="confirm-button">Confirmar Matrícula</button>
                </div>
            </div>
        `;

        // Adiciona o evento ao botão de confirmação
        document.getElementById('confirmar-btn').addEventListener('click', () => {
            window.location.href = `../confirm/confirm.html?id=${cursoId}`;
        });

    } catch (error) {
        console.error('Erro:', error);
        resultadoDiv.innerHTML = `<p class="error-message">Ocorreu um erro ao carregar os dados de confirmação: ${error.message}.</p>`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
});

document.addEventListener("DOMContentLoaded", () => {
  const resultadoDiv = document.getElementById("resultado");
  const filtroInput = document.getElementById("filtroPesquisa");
  const toggleButton = document.getElementById("toggleView");
  const loadingSpinner = document.querySelector(".loading-spinner-container");

  // Variável centralizada para o IP
  const BASE_IP = "localhost";
  const ENDPOINT_LOCAL = `http://${BASE_IP}:8000/search`;

  let todosOsCursos = [];
  // A visualização padrão agora é grade
  let isGridView = true;

  function gerarEstrelas(rating) {
    const maxEstrelas = 5;
    let estrelasHtml = "";
    const ratingNumerico = parseFloat(rating) || 0;
    const estrelasCheias = Math.floor(ratingNumerico);
    const temMeiaEstrela = ratingNumerico % 1 >= 0.5;

    for (let i = 0; i < estrelasCheias; i++) {
      estrelasHtml += "★"; // Estrela cheia
    }
    if (temMeiaEstrela) {
      estrelasHtml += "★"; // Simplificado para também ser cheia
    }
    const totalEstrelas = estrelasHtml.length;
    for (let i = totalEstrelas; i < maxEstrelas; i++) {
      estrelasHtml += "☆"; // Estrela vazia
    }
    return estrelasHtml;
  }

  // Dentro da função renderizarCursos, substitua a criação do cardHtml pelo código abaixo:

  function renderizarCursos(cursos) {
    resultadoDiv.innerHTML = "";
    if (cursos.length === 0) {
      resultadoDiv.innerHTML = `<p class="error-message">Nenhum curso encontrado.</p>`;
      return;
    }

    cursos.forEach((item) => {
      const courseName = item.descriptor?.name || "Curso sem nome";
      const courseImage =
        item.descriptor?.images?.[0]?.url ||
        "https://via.placeholder.com/400x200?text=Imagem+Indisponível";
      const priceValue = item.price?.value || "0";
      const priceCurrency = item.price?.currency || "BRL";
      const displayCurrency = priceCurrency === "BRL" ? "R$" : priceCurrency;
      const priceText =
        priceValue === "0.00" || priceValue === "0"
          ? "Grátis"
          : `${displayCurrency} ${priceValue.replace(".", ",")}`;
      const rating = item.rating || "0";
      const providerName = item.provider_name || "Provedor Desconhecido";
      const providerLogo =
        item.provider_logo || "https://via.placeholder.com/50";
      const itemId = item.id;

      let nivel = "",
        idioma = "",
        duracao = "";
      const metadataTag = item.tags?.find(
        (tag) => tag.descriptor?.code === "content-metadata"
      );
      if (metadataTag?.list) {
        metadataTag.list.forEach((meta) => {
          switch (meta.descriptor?.code) {
            case "learner-level":
              nivel = meta.value;
              break;
            case "lang-code":
              idioma = meta.value?.replace("pt-BR", "Português");
              break;
            case "course-duration":
              duracao = meta.value?.replace("PT", "").replace("H", "h");
              break;
          }
        });
      }

      const estrelasHtml = gerarEstrelas(rating);

      // --- INÍCIO DA MODIFICAÇÃO ---
      let actionButtonHtml;
      // Verifica se o nome do curso é "Introdução às Redes Quânticas"
      if (courseName === "Introdução às Redes Quânticas") {
        // Se for, o botão leva direto para a página do curso e muda o texto
        actionButtonHtml = `
                <a href="status/status.html?order_id=gercom-order-67890" class="access-button" target="_blank" rel="noopener noreferrer">
                    Acessar Curso <i class="fas fa-arrow-right"></i>
                </a>`;
      } else {
        // Para todos os outros cursos, mantém o comportamento padrão
        actionButtonHtml = `
                <a href="select/select.html?id=${itemId}" class="access-button" target="_blank" rel="noopener noreferrer">
                    Ver Detalhes <i class="fas fa-arrow-right"></i>
                </a>`;
      }
      // --- FIM DA MODIFICAÇÃO ---

      const cardHtml = `
            <div class="course-card">
                <img src="${courseImage}" alt="${courseName}" class="course-card-image">
                <div class="course-card-content">
                    <div class="provider-info">
                        <img src="${providerLogo}" alt="${providerName}" class="provider-logo">
                        <span class="provider-name">${providerName}</span>
                    </div>
                    <h3>${courseName}</h3>
                    <div class="course-details">
                        ${
                          nivel
                            ? `<span class="detail-item"><i class="fas fa-layer-group"></i> ${nivel}</span>`
                            : ""
                        }
                        ${
                          idioma
                            ? `<span class="detail-item"><i class="fas fa-globe"></i> ${idioma}</span>`
                            : ""
                        }
                        ${
                          duracao
                            ? `<span class="detail-item"><i class="far fa-clock"></i> ${duracao}</span>`
                            : ""
                        }
                    </div>
                </div>
                <div class="course-card-footer">
                    <div>
                        <div class="price ${
                          priceValue === "0" ? "free" : ""
                        }">${priceText}</div>
                        <div class="rating"><span>${estrelasHtml}</span> ${rating}</div>
                    </div>
                    ${actionButtonHtml}  <!-- Injeta o botão correto aqui -->
                </div>
            </div>
        `;
      resultadoDiv.innerHTML += cardHtml;
    });
  }

  filtroInput.addEventListener("input", (event) => {
    const termoFiltro = event.target.value.toLowerCase();

    // Filtro instantâneo sem delay ou spinner para uma experiência mais fluida
    const cursosFiltrados = todosOsCursos.filter((curso) => {
      const nomeCurso = curso.descriptor?.name?.toLowerCase() || "";
      const nomeProvedor = curso.provider_name?.toLowerCase() || "";
      const tags = JSON.stringify(curso.tags || "").toLowerCase();

      return (
        nomeCurso.includes(termoFiltro) ||
        nomeProvedor.includes(termoFiltro) ||
        tags.includes(termoFiltro)
      );
    });
    renderizarCursos(cursosFiltrados);
  });

  toggleButton.addEventListener("click", () => {
    isGridView = !isGridView;
    resultadoDiv.className = isGridView ? "grid-view" : "list-view";
    toggleButton.innerHTML = isGridView
      ? '<i class="fas fa-list"></i>'
      : '<i class="fas fa-th-large"></i>';
  });

  async function buscarCursosAutomaticamente() {
    loadingSpinner.style.display = "flex";
    resultadoDiv.innerHTML = "";

    try {
      const response = await fetch(ENDPOINT_LOCAL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok)
        throw new Error(`Erro na requisição: ${response.statusText}`);

      const data = await response.json();
      const providers = data.responses?.[0]?.message?.catalog?.providers || [];

      if (providers.length === 0) {
        resultadoDiv.innerHTML = `<p class="error-message">Nenhum provedor de cursos encontrado.</p>`;
        return;
      }

      todosOsCursos = [];
      providers.forEach((provider) => {
        provider.items?.forEach((item) => {
          item.provider_name =
            provider.descriptor?.name || "Provedor desconhecido";
          item.provider_logo = provider.descriptor?.images?.[0]?.url;
          todosOsCursos.push(item);
        });
      });

      renderizarCursos(todosOsCursos);
    } catch (error) {
      console.error("Erro:", error);
      resultadoDiv.innerHTML = `<p class="error-message">Ocorreu um erro ao buscar os cursos. Tente novamente mais tarde.</p>`;
    } finally {
      loadingSpinner.style.display = "none";
    }
  }

  // Define o ícone inicial do botão de toggle
  toggleButton.innerHTML = '<i class="fas fa-list"></i>';
  buscarCursosAutomaticamente();
});

// hooks/useExportReports.ts
import { useCallback } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

export const useExportReports = () => {
  // Função para formatar telefone para exportação
  const formatPhoneForExport = (phone: string): string => {
    if (!phone) return '';
    
    // Remove todos os caracteres especiais e espaços
    let cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Remove código do país se já existir (55 no início)
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Remove o 9 inicial se existir (após o DDD) para números de 11 dígitos
    if (cleanPhone.length === 11 && cleanPhone.charAt(2) === '9') {
      cleanPhone = cleanPhone.substring(0, 2) + cleanPhone.substring(3);
    }
    
    // Garantir que tenha pelo menos 10 dígitos (DDD + número)
    if (cleanPhone.length < 10) {
      return '';
    }
    
    // Adiciona o código do país 55
    return `55${cleanPhone}`;
  };
  // Exportar para PDF (método antigo - print da tela)
  const exportToPDF = useCallback(async (elementId: string, filename: string = 'relatorio.pdf') => {
    try {
      // Tentando exportar PDF para elemento
      
      const element = document.getElementById(elementId)
      if (!element) {
        // Elemento não encontrado
        throw new Error(`Elemento com ID "${elementId}" não encontrado`)
      }

      // Verificar se o elemento tem conteúdo (tabela com dados)
      const tableRows = element.querySelectorAll('tbody tr')
      if (tableRows.length === 0) {
        // Tabela vazia detectada
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      // Elemento encontrado, gerando canvas
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      })

      // Canvas gerado, criando PDF
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // PDF criado, salvando arquivo
      pdf.save(filename)
      
      // PDF exportado com sucesso
    } catch (error) {
      // Erro ao exportar PDF
      throw new Error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Função auxiliar para criar tabela PDF manualmente
  const createPDFTable = (pdf: jsPDF, headers: string[], data: string[][], startY: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 5
    const tableWidth = pageWidth - (margin * 2)
    
    // Definir larguras específicas para cada coluna (otimizado para 14 colunas)
    const columnWidths = [
      15, // Pos.
      25, // Nome
      20, // WhatsApp
      18, // Instagram
      18, // Cidade
      15, // Setor
      25, // Nome Cônjuge/Parceiro
      20, // WhatsApp Cônjuge/Parceiro
      18, // Instagram Cônjuge/Parceiro
      18, // Cidade Cônjuge/Parceiro
      15, // Setor Cônjuge/Parceiro
      12, // Contratos
      20, // Indicado por
      16  // Data
    ]
    
    const rowHeight = 7
    let currentY = startY

    // Cabeçalho
    pdf.setFillColor(41, 128, 185)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    
    let currentX = margin
    columnWidths.forEach((width, index) => {
      pdf.rect(currentX, currentY, width, rowHeight, 'F')
      if (headers[index]) {
        const headerText = headers[index].substring(0, 12) // Limitar cabeçalho
        pdf.text(headerText, currentX + 1, currentY + 5)
      }
      currentX += width
    })
    
    currentY += rowHeight

    // Dados
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(5)

    data.forEach((row, rowIndex) => {
      // Verificar se precisa de nova página
      if (currentY + rowHeight > pageHeight - 20) {
        pdf.addPage()
        currentY = 20
        
        // Repetir cabeçalho na nova página
        pdf.setFillColor(41, 128, 185)
        pdf.setTextColor(255, 255, 255)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7)
        
        currentX = margin
        columnWidths.forEach((width, index) => {
          pdf.rect(currentX, currentY, width, rowHeight, 'F')
          if (headers[index]) {
            const headerText = headers[index].substring(0, 12)
            pdf.text(headerText, currentX + 1, currentY + 5)
          }
          currentX += width
        })
        
        currentY += rowHeight
        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(5)
      }

      // Linha alternada
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(245, 245, 245)
        currentX = margin
        columnWidths.forEach(width => {
          pdf.rect(currentX, currentY, width, rowHeight, 'F')
          currentX += width
        })
      }

      // Dados da linha
      currentX = margin
      row.forEach((cell, colIndex) => {
        if (colIndex < columnWidths.length) {
          const width = columnWidths[colIndex]
          const maxChars = Math.floor(width / 2.5) // Calcular caracteres baseado na largura
          const cellText = String(cell || '').substring(0, maxChars)
          pdf.text(cellText, currentX + 1, currentY + 5)
          currentX += width
        }
      })

      currentY += rowHeight
    })
  }

  // Criar PDF com layout de cards (6 membros por página - 3x2) otimizado
  const createPDFCards = (pdf: jsPDF, members: Record<string, unknown>[], startY: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const cardsPerRow = 3
    const rowsPerPage = 2
    const cardWidth = (pageWidth - (margin * 2) - ((cardsPerRow - 1) * 6)) / cardsPerRow // 3 cards por linha, espaçamento menor
    const cardHeight = (pageHeight - startY - 20 - ((rowsPerPage - 1) * 6)) / rowsPerPage // 2 linhas por página, espaçamento menor
    let currentX = margin
    let currentY = startY

    members.forEach((member, index) => {
      const cardsPerPage = cardsPerRow * rowsPerPage // 6 cards por página
      
      // Verificar se precisa de nova página (6 cards por página: 3x2)
      if (index > 0 && index % cardsPerPage === 0) {
        pdf.addPage()
        currentY = startY
        currentX = margin
      }

      // Verificar se precisa quebrar linha (3 cards por linha)
      if (index > 0 && index % cardsPerRow === 0 && index % cardsPerPage !== 0) {
        currentY += cardHeight + 8
        currentX = margin
      }

      // Desenhar card
      pdf.setFillColor(245, 245, 245)
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'F')
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'S')

      // Função para truncar texto se necessário
      const truncateText = (text: string, maxWidth: number, fontSize: number) => {
        const avgCharWidth = fontSize * 0.6 // Estimativa da largura do caractere
        const maxChars = Math.floor(maxWidth / avgCharWidth)
        return text.length > maxChars ? text.substring(0, maxChars - 3) + '...' : text
      }

      // Título do card com posição e contratos
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      const positionText = member.ranking_position ? `${member.ranking_position}º` : 'N/A'
      const contractsText = member.contracts_completed ? `${member.contracts_completed} contratos` : '0 contratos'
      pdf.text(`${positionText} - ${String(member.name || '')}`, currentX + 2, currentY + 8)
      
      // Mostrar contratos na linha seguinte
      pdf.setFontSize(6)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${contractsText}`, currentX + 2, currentY + 12)

      // Dados da pessoa principal
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      
      let textY = currentY + 18  // Ajustado para dar espaço para a linha de contratos
      pdf.text(`WhatsApp: ${formatPhoneForExport(member.phone as string)}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Instagram: ${String(member.instagram || '')}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Setor-Cidade: ${String(member.sector || '')} - ${String(member.city || '')}`, currentX + 2, textY)
      
      // Dados do parceiro
      textY += 6
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.text(`Parceiro: ${String(member.couple_name || '')}`, currentX + 2, textY)
      
      pdf.setFont('helvetica', 'normal')
      textY += 4.5
      pdf.text(`WhatsApp: ${formatPhoneForExport(member.couple_phone as string)}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Instagram: ${String(member.couple_instagram || '')}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Setor-Cidade: ${String(member.couple_sector || '')} - ${String(member.couple_city || '')}`, currentX + 2, textY)

      // Informações adicionais
      textY += 6
      pdf.setFontSize(6)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Por: ${String(member.referrer || '')}`, currentX + 2, textY)

      // Próximo card (3 por linha)
      if ((index + 1) % cardsPerRow === 0) {
        currentX = margin // Volta para o início da linha
      } else {
        currentX += cardWidth + 8 // Próximo card na mesma linha
      }
    })
  }

  // Exportar membros para PDF estruturado (layout de cards)
  const exportMembersToPDF = useCallback((members: Record<string, unknown>[]) => {
    try {
      if (!members || members.length === 0) {
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      // Criar PDF estruturado
      const pdf = new jsPDF('l', 'mm', 'a4') // Landscape
      
      // Título
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Relatório Completo de Membros', 20, 15)
      
      // Data de geração e total
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 25)
      pdf.text(`Total: ${members.length} membros`, 200, 25)
      
      // Criar cards
      createPDFCards(pdf, members, 35)

      pdf.save('membros_completo.pdf')
    } catch (error) {
      throw new Error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Criar PDF de amigos com layout de cards (6 por página - 3x2) otimizado
  const createFriendsPDFCards = (pdf: jsPDF, friends: unknown[], startY: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const cardsPerRow = 3
    const rowsPerPage = 2
    const cardWidth = (pageWidth - (margin * 2) - ((cardsPerRow - 1) * 6)) / cardsPerRow // 3 cards por linha, espaçamento menor
    const cardHeight = (pageHeight - startY - 20 - ((rowsPerPage - 1) * 6)) / rowsPerPage // 2 linhas por página, espaçamento menor
    let currentX = margin
    let currentY = startY

    friends.forEach((friend, index) => {
      const f = friend as Record<string, unknown>
      const cardsPerPage = cardsPerRow * rowsPerPage // 6 cards por página
      
      // Verificar se precisa de nova página (6 cards por página: 3x2)
      if (index > 0 && index % cardsPerPage === 0) {
        pdf.addPage()
        currentY = startY
        currentX = margin
      }

      // Verificar se precisa quebrar linha (3 cards por linha)
      if (index > 0 && index % cardsPerRow === 0 && index % cardsPerPage !== 0) {
        currentY += cardHeight + 8
        currentX = margin
      }

      // Desenhar card
      pdf.setFillColor(245, 245, 245)
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'F')
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'S')

      // Função para truncar texto se necessário
      const truncateText = (text: string, maxWidth: number, fontSize: number) => {
        const avgCharWidth = fontSize * 0.6 // Estimativa da largura do caractere
        const maxChars = Math.floor(maxWidth / avgCharWidth)
        return text.length > maxChars ? text.substring(0, maxChars - 3) + '...' : text
      }

      // Título do card com posição (sem truncar nomes)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text(`${String(f.name || '')}`, currentX + 2, currentY + 8)

      // Dados da pessoa principal
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      
      let textY = currentY + 15
      pdf.text(`WhatsApp: ${formatPhoneForExport(f.phone as string)}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Instagram: ${String(f.instagram || '')}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Setor-Cidade: ${String(f.sector || '')} - ${String(f.city || '')}`, currentX + 2, textY)
      
      // Dados do parceiro
      textY += 6
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.text(`Parceiro: ${String(f.couple_name || '')}`, currentX + 2, textY)
      
      pdf.setFont('helvetica', 'normal')
      textY += 4.5
      pdf.text(`WhatsApp: ${formatPhoneForExport(f.couple_phone as string)}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Instagram: ${String(f.couple_instagram || '')}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Setor-Cidade: ${String(f.couple_sector || '')} - ${String(f.couple_city || '')}`, currentX + 2, textY)

      // Informações adicionais
      textY += 6
      pdf.setFontSize(6)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Por: ${String(f.member_name || f.referrer || '')}`, currentX + 2, textY)

      // Próximo card (3 por linha)
      if ((index + 1) % cardsPerRow === 0) {
        currentX = margin // Volta para o início da linha
      } else {
        currentX += cardWidth + 8 // Próximo card na mesma linha
      }
    })
  }

  // Exportar amigos para PDF estruturado (layout de cards)
  const exportFriendsToPDF = useCallback((friends: unknown[]) => {
    try {
      if (!friends || friends.length === 0) {
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      const pdf = new jsPDF('l', 'mm', 'a4') // Landscape
      
      // Título
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Relatório Completo de Amigos', 20, 15)
      
      // Data de geração e total
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 25)
      pdf.text(`Total: ${friends.length} amigos`, 200, 25)
      
      // Criar cards
      createFriendsPDFCards(pdf, friends, 35)

      pdf.save('amigos_completo.pdf')
    } catch (error) {
      throw new Error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Exportar dados para Excel
  const exportToExcel = useCallback((data: Record<string, unknown>[], filename: string = 'relatorio.xlsx', sheetName: string = 'Relatório') => {
    try {
      // Tentando exportar Excel
      
      if (!data || data.length === 0) {
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      // Para grandes volumes (>10.000 registros), usar processamento em chunks
      if (data.length > 10000) {
        // Processando grande volume de dados em chunks
        
        const chunkSize = 5000
        const chunks = []
        
        for (let i = 0; i < data.length; i += chunkSize) {
          chunks.push(data.slice(i, i + chunkSize))
        }
        
        const workbook = XLSX.utils.book_new()
        
        chunks.forEach((chunk, index) => {
          const worksheet = XLSX.utils.json_to_sheet(chunk)
          const sheetNameChunk = chunks.length > 1 ? `${sheetName} - Parte ${index + 1}` : sheetName
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetNameChunk)
        })
        
        // Excel criado com múltiplas abas, salvando arquivo
        XLSX.writeFile(workbook, filename)
      } else {
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        
        // Excel criado, salvando arquivo
        XLSX.writeFile(workbook, filename)
      }
      
      // Excel exportado com sucesso
    } catch (error) {
      // Erro ao exportar Excel
      throw new Error(`Erro ao exportar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Exportar membros para Excel
  const exportMembersToExcel = useCallback((members: Record<string, unknown>[]) => {
    // Exportando membros com dados completos organizados
    
    const data = members.map(member => ({
      // Posição e Performance
      'Posição': member.ranking_position || '',
      'Contratos Completos': member.contracts_completed || 0,
      
      // Dados da Pessoa Principal
      'Nome': member.name,
      'WhatsApp': formatPhoneForExport(member.phone as string),
      'Instagram': member.instagram,
      'Cidade': member.city,
      'Setor': member.sector,
      
      // Dados do Parceiro
      'Nome Parceiro': member.couple_name || '',
      'WhatsApp Parceiro': formatPhoneForExport(member.couple_phone as string),
      'Instagram Parceiro': member.couple_instagram || '',
      'Cidade Parceiro': member.couple_city || '',
      'Setor Parceiro': member.couple_sector || '',
      
      // Informações do Sistema
      'Indicado por': member.referrer || '',
      'Data de Cadastro': member.registration_date ? new Date(member.registration_date as string).toLocaleDateString('pt-BR') : ''
    }))

    exportToExcel(data, 'membros.xlsx', 'Membros')
  }, [exportToExcel])

  // Exportar contratos para Excel
  const exportContractsToExcel = useCallback((contracts: Record<string, unknown>[]) => {
    // Exportando contratos com dados completos organizados
    
    const data = contracts.map(contract => ({
      // Dados da Primeira Pessoa
      'Nome Pessoa 1': contract.couple_name_1,
      'WhatsApp Pessoa 1': formatPhoneForExport(contract.couple_phone_1 as string),
      'Instagram Pessoa 1': contract.couple_instagram_1,
      'Cidade Pessoa 1': contract.couple_city_1 || '',
      'Setor Pessoa 1': contract.couple_sector_1 || '',
      
      // Dados da Segunda Pessoa
      'Nome Pessoa 2': contract.couple_name_2,
      'WhatsApp Pessoa 2': formatPhoneForExport(contract.couple_phone_2 as string),
      'Instagram Pessoa 2': contract.couple_instagram_2,
      'Cidade Pessoa 2': contract.couple_city_2 || '',
      'Setor Pessoa 2': contract.couple_sector_2 || '',
      
      // Informações do Contrato
      'ID Contrato': contract.id,
      'Membro Responsável': (contract.member_data as Record<string, unknown>)?.name || 'N/A',
      'Data do Contrato': contract.contract_date ? new Date(contract.contract_date as string).toLocaleDateString('pt-BR') : '',
      'Data de Conclusão': contract.completion_date ? new Date(contract.completion_date as string).toLocaleDateString('pt-BR') : '',
      'Post Verificado 1': contract.post_verified_1 ? 'Sim' : 'Não',
      'Post Verificado 2': contract.post_verified_2 ? 'Sim' : 'Não'
    }))

    exportToExcel(data, 'contratos.xlsx', 'Contratos')
  }, [exportToExcel])

  // Função auxiliar para criar cards organizados
  const createReportCard = (pdf: jsPDF, title: string, data: Array<{label: string, value: string | number}>, startX: number, startY: number, width: number, height: number) => {
    // Fundo do card
    pdf.setFillColor(248, 249, 250)
    pdf.rect(startX, startY, width, height, 'F')
    
    // Borda do card
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.5)
    pdf.rect(startX, startY, width, height, 'S')
    
    // Título do card
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(41, 128, 185)
    pdf.text(title, startX + 5, startY + 10)
    
    // Linha separadora
    pdf.setDrawColor(226, 232, 240)
    pdf.line(startX + 5, startY + 15, startX + width - 5, startY + 15)
    
    // Dados do card
    let itemY = startY + 25
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    
    data.forEach((item, index) => {
      if (itemY > startY + height - 10) return // Não ultrapassar o card
      
      // Label
      pdf.setFont('helvetica', 'normal')
      pdf.text(item.label, startX + 5, itemY)
      
      // Valor
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text(String(item.value), startX + width - 20, itemY)
      
      pdf.setTextColor(0, 0, 0)
      itemY += 8
    })
  }

  // Exportar dados do relatório para PDF (formato cards organizados)
  const exportReportDataToPDF = useCallback((reportData: Record<string, unknown>, memberStats: Record<string, unknown>, topMembersData?: Array<{member: string, count: number, position: number}>) => {
    try {
      if (!reportData || !memberStats) {
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Título principal
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('RELATÓRIO DO SISTEMA', 20, 25)
      
      // Data de geração
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 35)
      
      let currentY = 50

      // PRIMEIRA PÁGINA - CARDS PRINCIPAIS
      
      // Card 1: Estatísticas Gerais (esquerda superior)
      const statsData = [
        { label: 'Total de Membros', value: (memberStats.total_members as number) || 0 },
        { label: 'Membros Verdes', value: (memberStats.green_members as number) || 0 },
        { label: 'Membros Amarelos', value: (memberStats.yellow_members as number) || 0 },
        { label: 'Membros Vermelhos', value: (memberStats.red_members as number) || 0 },
        { label: 'Top 1500', value: (memberStats.top_1500_members as number) || 0 }
      ]
      createReportCard(pdf, 'ESTATÍSTICAS GERAIS', statsData, 20, currentY, 80, 70)
      
      // Card 2: Membros por Cidade (direita superior)
      const usersByCity = reportData.usersByCity as Record<string, number> || {}
      const citiesData = Object.entries(usersByCity)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5) // Top 5 cidades
        .map(([city, count]) => ({ label: city, value: count }))
      
      createReportCard(pdf, 'TOP 5 CIDADES', citiesData, 110, currentY, 80, 70)
      
      currentY += 80

      // Card 3: Distribuição por Status (esquerda meio)
      const usersByStatus = reportData.usersByStatus as Array<{ name: string, value: number, color: string }> || []
      const statusData = usersByStatus.map(status => ({ 
        label: status.name, 
        value: status.value 
      }))
      
      createReportCard(pdf, 'DISTRIBUIÇÃO POR STATUS', statusData, 20, currentY, 80, 60)
      
      // Card 4: Cadastros Recentes (direita meio)
      const registrationsByDay = reportData.registrationsByDay as Array<{ date: string, quantidade: number }> || []
      const recentData = registrationsByDay
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5) // Últimos 5 dias
        .map(reg => ({ 
          label: new Date(reg.date).toLocaleDateString('pt-BR'), 
          value: reg.quantidade 
        }))
      
      createReportCard(pdf, 'CADASTROS RECENTES', recentData, 110, currentY, 80, 60)
      
      currentY += 70

      // Card 5: Top 5 Membros com mais Amigos (esquerda inferior)
      if (topMembersData && topMembersData.length > 0) {
        const topMembersCardData = topMembersData.slice(0, 5).map(member => ({
          label: `${member.position}º ${member.member}`,
          value: `${member.count} amigos`
        }))
        
        createReportCard(pdf, 'TOP 5 - MAIS AMIGOS', topMembersCardData, 20, currentY, 80, 60)
      }
      
      // Card 6: Setores por Cidade (direita inferior)
      const sectorsGroupedByCity = reportData.sectorsGroupedByCity as Record<string, any> || {}
      const sectorsData = Object.entries(sectorsGroupedByCity)
        .sort(([, a], [, b]) => (b as any).count - (a as any).count)
        .slice(0, 4) // Top 4 cidades com mais setores
        .map(([city, data]) => {
          const cityData = data as { count: number, totalSectors: number, sectors: string[] }
          return {
            label: city,
            value: `${cityData.totalSectors} setores`
          }
        })
      
      createReportCard(pdf, 'SETORES POR CIDADE', sectorsData, 110, currentY, 80, 60)

      pdf.save('dados_relatorio.pdf')
    } catch (error) {
      throw new Error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Exportar amigos para Excel
  const exportFriendsToExcel = useCallback((friends: unknown[]) => {
    // Exportando amigos com dados completos organizados
    
    const data = friends.map(friend => {
      const f = friend as Record<string, unknown>
      return {
        // Dados da Pessoa Principal
        'Nome': f.name,
        'WhatsApp': formatPhoneForExport(f.phone as string),
        'Instagram': f.instagram,
        'Cidade': f.city,
        'Setor': f.sector,
        
        // Dados do Parceiro
        'Nome Parceiro': f.couple_name || '',
        'WhatsApp Parceiro': formatPhoneForExport(f.couple_phone as string),
        'Instagram Parceiro': f.couple_instagram || '',
        'Cidade Parceiro': f.couple_city || '',
        'Setor Parceiro': f.couple_sector || '',
        
        // Informações do Sistema
        'Indicado por': f.member_name || f.referrer || '',
        'Data de Cadastro': (f.created_at || f.registration_date) ? new Date((f.created_at || f.registration_date) as string).toLocaleDateString('pt-BR') : ''
      }
    })

    exportToExcel(data, 'amigos.xlsx', 'Amigos')
  }, [exportToExcel])

  // Criar PDF de pessoas de saúde com layout de cards (6 por página - 3x2)
  const createSaudePeoplePDFCards = (pdf: jsPDF, people: unknown[], startY: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const cardsPerRow = 3
    const rowsPerPage = 2
    const cardWidth = (pageWidth - (margin * 2) - ((cardsPerRow - 1) * 6)) / cardsPerRow
    const cardHeight = (pageHeight - startY - 20 - ((rowsPerPage - 1) * 6)) / rowsPerPage
    let currentX = margin
    let currentY = startY

    people.forEach((person, index) => {
      const p = person as Record<string, unknown>
      const cardsPerPage = cardsPerRow * rowsPerPage // 6 cards por página
      
      // Verificar se precisa de nova página (6 cards por página: 3x2)
      if (index > 0 && index % cardsPerPage === 0) {
        pdf.addPage()
        currentY = startY
        currentX = margin
      }

      // Verificar se precisa quebrar linha (3 cards por linha)
      if (index > 0 && index % cardsPerRow === 0 && index % cardsPerPage !== 0) {
        currentY += cardHeight + 8
        currentX = margin
      }

      // Desenhar card com cor de fundo diferente
      pdf.setFillColor(240, 248, 255) // Azul claro para saúde
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'F')
      pdf.setDrawColor(100, 149, 237) // Borda azul
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'S')

      // Título do card - Líder
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(16, 78, 139) // Azul escuro
      pdf.text(`Líder: ${String(p.lider_nome_completo || '')}`, currentX + 2, currentY + 8)

      // Dados do Líder
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      
      let textY = currentY + 14
      pdf.text(`WhatsApp: ${String(p.lider_whatsapp || '')}`, currentX + 2, textY)
      
      // Dados da Pessoa
      textY += 6
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.setTextColor(34, 139, 34) // Verde para pessoa
      pdf.text(`Pessoa: ${String(p.pessoa_nome_completo || '')}`, currentX + 2, textY)
      
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      textY += 4.5
      pdf.text(`WhatsApp: ${String(p.pessoa_whatsapp || '')}`, currentX + 2, textY)
      
      // Localização
      if (p.cidade || p.cep) {
        textY += 4.5
        const locationText = p.cidade ? `Cidade: ${String(p.cidade)}` : `CEP: ${String(p.cep || '')}`
        pdf.text(locationText, currentX + 2, textY)
      }

      // Observações (truncadas se muito longas)
      if (p.observacoes) {
        textY += 6
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(6)
        pdf.setTextColor(100, 100, 100)
        const obsText = String(p.observacoes)
        const maxChars = 80
        const truncatedObs = obsText.length > maxChars ? obsText.substring(0, maxChars) + '...' : obsText
        pdf.text(`Obs: ${truncatedObs}`, currentX + 2, textY)
      }

      // Data de cadastro
      textY += 4.5
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(6)
      pdf.setTextColor(150, 150, 150)
      if (p.created_at) {
        const date = new Date(p.created_at as string).toLocaleDateString('pt-BR')
        pdf.text(`Cadastrado em: ${date}`, currentX + 2, textY)
      }

      // Próximo card (3 por linha)
      if ((index + 1) % cardsPerRow === 0) {
        currentX = margin
      } else {
        currentX += cardWidth + 8
      }
    })
  }

  // Exportar pessoas de saúde para PDF estruturado (layout de cards)
  const exportSaudePeopleToPDF = useCallback((people: unknown[]) => {
    try {
      if (!people || people.length === 0) {
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      const pdf = new jsPDF('l', 'mm', 'a4') // Landscape
      
      // Título
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Relatório Completo', 20, 15)
      
      // Data de geração e total
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 25)
      pdf.text(`Total: ${people.length} pessoas`, 200, 25)
      
      // Criar cards
      createSaudePeoplePDFCards(pdf, people, 35)

      pdf.save('pessoas_saude_completo.pdf')
    } catch (error) {
      throw new Error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  return {
    exportToPDF,
    exportToExcel,
    exportMembersToExcel,
    exportContractsToExcel,
    exportReportDataToPDF,
    exportFriendsToExcel,
    exportMembersToPDF,
    exportFriendsToPDF,
    exportSaudePeopleToPDF
  }
}

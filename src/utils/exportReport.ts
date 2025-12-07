import { Ticket } from '../types';
import { formatDate } from './formatDate';
import { formatCurrency } from './formatCurrency';

/**
 * Exporta relatório para Excel (CSV)
 */
export function exportToExcel(
  tickets: Ticket[],
  stats: {
    total: number;
    abertos: number;
    emAndamento: number;
    resolvidos: number;
    fechados: number;
  },
  ticketsByCategory: Record<string, number>,
  ticketsByPriority: Record<string, number>,
  ticketsByStatus: Record<string, number>,
  ticketsByTechnician: Record<string, { name: string; count: number }>
) {
  // Criar conteúdo CSV
  let csvContent = 'Relatório de Chamados\n';
  csvContent += `Gerado em: ${formatDate(new Date())}\n\n`;

  // Estatísticas gerais
  csvContent += 'ESTATÍSTICAS GERAIS\n';
  csvContent += `Total de Chamados,${stats.total}\n`;
  csvContent += `Abertos,${stats.abertos}\n`;
  csvContent += `Em Andamento,${stats.emAndamento}\n`;
  csvContent += `Resolvidos,${stats.resolvidos}\n`;
  csvContent += `Fechados,${stats.fechados}\n\n`;

  // Por categoria
  csvContent += 'CHAMADOS POR CATEGORIA\n';
  csvContent += 'Categoria,Quantidade\n';
  Object.entries(ticketsByCategory).forEach(([category, count]) => {
    csvContent += `${category},${count}\n`;
  });
  csvContent += '\n';

  // Por prioridade
  csvContent += 'CHAMADOS POR PRIORIDADE\n';
  csvContent += 'Prioridade,Quantidade\n';
  Object.entries(ticketsByPriority).forEach(([priority, count]) => {
    csvContent += `${priority},${count}\n`;
  });
  csvContent += '\n';

  // Por status
  csvContent += 'CHAMADOS POR STATUS\n';
  csvContent += 'Status,Quantidade\n';
  Object.entries(ticketsByStatus).forEach(([status, count]) => {
    csvContent += `${status},${count}\n`;
  });
  csvContent += '\n';

  // Por técnico
  csvContent += 'CHAMADOS POR TÉCNICO\n';
  csvContent += 'Técnico,Quantidade\n';
  Object.values(ticketsByTechnician).forEach((tech) => {
    csvContent += `${tech.name},${tech.count}\n`;
  });
  csvContent += '\n';

  // Detalhes dos tickets
  csvContent += 'DETALHES DOS CHAMADOS\n';
  csvContent += 'ID,Título,Categoria,Prioridade,Status,Criado por,Atribuído a,Data de Criação,Data de Atualização,Valor Total,Valor Integração\n';
  tickets.forEach((ticket) => {
    const row = [
      ticket.id,
      `"${ticket.title.replace(/"/g, '""')}"`,
      ticket.category,
      ticket.priority,
      ticket.status,
      ticket.createdBy.name,
      ticket.assignedTo?.name || '',
      formatDate(ticket.createdAt),
      formatDate(ticket.updatedAt),
      ticket.totalValue ? formatCurrency(ticket.totalValue) : '',
      ticket.integrationValue ? formatCurrency(ticket.integrationValue) : '',
    ].join(',');
    csvContent += row + '\n';
  });

  // Criar blob e download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio-chamados-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta relatório para PDF
 */
export async function exportToPDF(
  tickets: Ticket[],
  stats: {
    total: number;
    abertos: number;
    emAndamento: number;
    resolvidos: number;
    fechados: number;
  },
  ticketsByCategory: Record<string, number>,
  ticketsByPriority: Record<string, number>,
  ticketsByStatus: Record<string, number>,
  ticketsByTechnician: Record<string, { name: string; count: number }>
) {
  // Importar jsPDF dinamicamente
  const { default: jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Chamados', margin, yPosition);
  yPosition += 10;

  // Data de geração
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${formatDate(new Date())}`, margin, yPosition);
  yPosition += 15;

  // Estatísticas gerais
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Estatísticas Gerais', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Chamados: ${stats.total}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Abertos: ${stats.abertos}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Em Andamento: ${stats.emAndamento}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Resolvidos: ${stats.resolvidos}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Fechados: ${stats.fechados}`, margin, yPosition);
  yPosition += 12;

  // Verificar se precisa de nova página
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Por categoria
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Chamados por Categoria', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  Object.entries(ticketsByCategory).forEach(([category, count]) => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(`${category}: ${count}`, margin, yPosition);
    yPosition += 6;
  });
  yPosition += 6;

  // Por prioridade
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Chamados por Prioridade', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  Object.entries(ticketsByPriority).forEach(([priority, count]) => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(`${priority}: ${count}`, margin, yPosition);
    yPosition += 6;
  });
  yPosition += 6;

  // Por status
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Chamados por Status', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  Object.entries(ticketsByStatus).forEach(([status, count]) => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(`${status}: ${count}`, margin, yPosition);
    yPosition += 6;
  });
  yPosition += 6;

  // Por técnico
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Chamados por Técnico', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  Object.values(ticketsByTechnician).forEach((tech) => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(`${tech.name}: ${tech.count}`, margin, yPosition);
    yPosition += 6;
  });
  yPosition += 12;

  // Detalhes dos tickets
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalhes dos Chamados', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Cabeçalho da tabela
  const headers = ['ID', 'Título', 'Categoria', 'Status', 'Prioridade', 'Criado por'];
  const colWidths = [15, 60, 25, 30, 25, 35];
  let xPos = margin;
  
  doc.setFont('helvetica', 'bold');
  headers.forEach((header, index) => {
    doc.text(header, xPos, yPosition);
    xPos += colWidths[index];
  });
  yPosition += 8;

  // Linhas dos tickets
  doc.setFont('helvetica', 'normal');
  tickets.forEach((ticket) => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
      // Redesenhar cabeçalho
      xPos = margin;
      doc.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        doc.text(header, xPos, yPosition);
        xPos += colWidths[index];
      });
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
    }

    xPos = margin;
    const row = [
      ticket.id,
      ticket.title.length > 30 ? ticket.title.substring(0, 27) + '...' : ticket.title,
      ticket.category,
      ticket.status,
      ticket.priority,
      ticket.createdBy.name.length > 15 ? ticket.createdBy.name.substring(0, 12) + '...' : ticket.createdBy.name,
    ];
    
    row.forEach((cell, index) => {
      doc.text(cell, xPos, yPosition);
      xPos += colWidths[index];
    });
    yPosition += 6;
  });

  // Salvar PDF
  doc.save(`relatorio-chamados-${new Date().toISOString().split('T')[0]}.pdf`);
}




import Swal from 'sweetalert2';

export const modalSucesso = (mensagem: string, titulo = 'Sucesso!') => {
  return Swal.fire({
    title: titulo,
    text: mensagem,
    icon: 'success',
    confirmButtonColor: '#2F6B38',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-2xl',
      title: 'text-2xl font-bold text-gray-900',
    }
  });
};

export const modalAlerta = (mensagem: string, titulo = 'Atenção!') => {
  return Swal.fire({
    title: titulo,
    text: mensagem,
    icon: 'warning',
    confirmButtonColor: '#eab308', // yellow-500
    confirmButtonText: 'Entendi',
    customClass: {
      popup: 'rounded-2xl border-2 border-yellow-200',
      title: 'text-2xl font-bold text-gray-900',
    }
  });
};

export const modalErro = (mensagem: string, titulo = 'Erro!') => {
  return Swal.fire({
    title: titulo,
    text: mensagem,
    icon: 'error',
    confirmButtonColor: '#ef4444', // red-500
    confirmButtonText: 'Voltar',
    customClass: {
      popup: 'rounded-2xl border-2 border-red-200',
      title: 'text-2xl font-bold text-gray-900',
    }
  });
};

export const modalConfirmacao = (mensagem: string, titulo = 'Tem certeza?', confirmText = 'Sim, continuar') => {
  return Swal.fire({
    title: titulo,
    text: mensagem,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2F6B38',
    cancelButtonColor: '#ef4444',
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    customClass: {
      popup: 'rounded-2xl',
      title: 'text-2xl font-bold text-gray-900',
    }
  });
};

import React from 'react';

const RefundPolicy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Политика возвратов</h1>
      <p className="mb-4">
        Мы хотим, чтобы вы остались довольны покупкой. Ниже приведены условия возвратов:
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">Право на возврат</h2>
      <p className="mb-4">
        Возвраты осуществляются по нашему усмотрению. Если вы считаете, что имеете право на
        возврат, пожалуйста, свяжитесь со службой поддержки в течение 14 дней после покупки и
        опишите проблему.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">Процесс</h2>
      <p className="mb-4">
        Одобренные возвраты будут зачислены на исходный способ оплаты. Это может занять
        несколько рабочих дней, прежде чем сумма появится в выписке.
      </p>
      <p className="mt-8 text-sm text-gray-500">
        Last updated: February 18, 2026
      </p>
    </div>
  );
};

export default RefundPolicy;

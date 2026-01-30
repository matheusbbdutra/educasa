#!/bin/bash

# Script de configuração do Sentry para EducaSA

echo "🔧 Configuração do Sentry para EducaSA"
echo "=================================="

# Verifica se já existe um DSN configurado
if [ -f ".env" ] && grep -q "SENTRY_DSN=" .env; then
    echo "⚠️  Sentry DSN já configurado no .env"
    read -p "Deseja reconfigurar? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Configuração cancelada"
        exit 1
    fi
fi

# Solicita o DSN do Sentry
echo ""
echo "📋 Para obter seu DSN do Sentry:"
echo "1. Acesse: https://sentry.io"
echo "2. Crie um novo projeto ou selecione um existente"
echo "3. Vá para Settings > Client Keys (DSN)"
echo "4. Copie o DSN (começa com https://)"
echo ""

read -p "🔑 Digite seu Sentry DSN: " SENTRY_DSN

if [ -z "$SENTRY_DSN" ]; then
    echo "❌ DSN não pode ser vazio"
    exit 1
fi

# Verifica se o DSN parece válido
if [[ ! $SENTRY_DSN =~ ^https:// ]]; then
    echo "❌ DSN inválido. Deve começar com https://"
    exit 1
fi

# Solicita o ambiente
echo ""
read -p "🌍 Digite o ambiente (development/staging/production): " ENVIRONMENT
if [ -z "$ENVIRONMENT" ]; then
    ENVIRONMENT="development"
fi

# Adiciona ao .env
if [ ! -f ".env" ]; then
    echo ".env" > .env
fi

# Remove linhas existentes se houver
sed -i '/^SENTRY_DSN=/d' .env
sed -i '/^SENTRY_ENVIRONMENT=/d' .env

# Adiciona as novas configurações
echo "" >> .env
echo "# Sentry Configuration" >> .env
echo "SENTRY_DSN=\"$SENTRY_DSN\"" >> .env
echo "SENTRY_ENVIRONMENT=\"$ENVIRONMENT\"" >> .env

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📝 Arquivo .env atualizado com:"
echo "   SENTRY_DSN=$SENTRY_DSN"
echo "   SENTRY_ENVIRONMENT=$ENVIRONMENT"
echo ""
echo "🚀 Próximos passos:"
echo "1. Reinicie o servidor de desenvolvimento"
echo "2. Acesse: http://localhost:3000/test-sentry"
echo "3. Teste a integração com os botões disponíveis"
echo ""
echo "📊 Seus erros aparecerão em: https://sentry.io"
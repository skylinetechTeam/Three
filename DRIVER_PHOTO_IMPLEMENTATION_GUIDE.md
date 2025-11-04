# 📸 Guia de Implementação - Foto do Motorista

## ✅ O que foi implementado:

### 1. **Upload automático para Supabase Storage:**
- ✅ Motorista tira foto → salva localmente + upload para Supabase
- ✅ Foto armazenada em: `driver-photos/drivers/driver_{id}_{timestamp}.jpg`
- ✅ URL pública salva em `drivers.photo_url`

### 2. **Componente DriverAvatar:**
- ✅ Busca foto do motorista do Supabase usando `driverId`
- ✅ Exibe loading enquanto carrega
- ✅ Fallback para ícone padrão se não tiver foto
- ✅ Tamanho customizável

### 3. **Integração sem modificar API:**
- ✅ API continua retornando apenas `driverId`
- ✅ App busca foto diretamente do Supabase
- ✅ Zero mudanças no backend

## 🛠️ Setup necessário:

### 1. **Execute no SQL do Supabase:**

```sql
-- Adicionar coluna photo_url
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Criar bucket para fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-photos', 'driver-photos', true)
ON CONFLICT (id) DO NOTHING;
```

### 2. **Configure políticas no Supabase Storage:**

Vá em Storage → Policies → Criar as seguintes políticas no bucket `driver-photos`:

- **Upload:** Permite authenticated
- **Read:** Permite public
- **Update:** Permite authenticated
- **Delete:** Permite authenticated

Ou execute o SQL completo em `DRIVER_PHOTO_STORAGE_SETUP.sql`

## 📱 Como usar no app do passageiro:

### **Exemplo 1: TripConfirmationModal**

```jsx
import DriverAvatar from '../../components/DriverAvatar';

// Dentro do componente, onde você exibe info do motorista:
<View style={styles.driverInfo}>
  <DriverAvatar 
    driverId={activeRequest?.driver?.id} 
    size={60} 
  />
  <View style={styles.driverDetails}>
    <Text style={styles.driverName}>{activeRequest?.driver?.name}</Text>
    <Text style={styles.driverCar}>{activeRequest?.driver?.vehicle}</Text>
  </View>
</View>
```

### **Exemplo 2: HomeScreen (quando motorista aceita)**

```jsx
import DriverAvatar from '../components/DriverAvatar';

// Quando exibir info do motorista que aceitou a corrida:
<View style={styles.assignedDriverCard}>
  <DriverAvatar 
    driverId={assignedDriver.id} 
    size={80}
    style={{ borderWidth: 2, borderColor: '#10B981' }}
  />
  <Text>{assignedDriver.name}</Text>
</View>
```

### **Exemplo 3: Lista de motoristas próximos**

```jsx
{nearbyDrivers.map((driver) => (
  <View key={driver.id} style={styles.driverItem}>
    <DriverAvatar driverId={driver.id} size={40} />
    <Text>{driver.name}</Text>
    <Text>{driver.distance}km</Text>
  </View>
))}
```

## 🔍 Props do componente DriverAvatar:

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `driverId` | number/string | **required** | ID do motorista (vem da API) |
| `size` | number | 50 | Tamanho do avatar em pixels |
| `style` | object | null | Estilos adicionais |

## 🎨 Estados visuais:

### **Loading:**
```
┌─────────┐
│    ⏳   │  <- ActivityIndicator
└─────────┘
```

### **Com foto:**
```
┌─────────┐
│  [FOTO] │  <- Imagem do motorista
└─────────┘
```

### **Sem foto (fallback):**
```
┌─────────┐
│    👤   │  <- Ícone pessoa
└─────────┘
```

## 🔄 Fluxo completo:

### **Do lado do motorista:**
```
1. Motorista faz login
2. Tira foto
3. Foto salva localmente
4. Upload automático para Supabase Storage
5. URL pública salva em drivers.photo_url
6. Login completo
```

### **Do lado do passageiro:**
```
1. API retorna dados do motorista (com driverId)
2. <DriverAvatar driverId={driver.id} />
3. Componente busca photo_url do Supabase
4. Exibe foto ou fallback
```

## 🧪 Como testar:

### **Teste 1: Upload da foto (motorista)**
1. Faça login como motorista
2. Tire uma foto
3. Verifique no console: "✅ Foto enviada com sucesso: [URL]"
4. Confirme no Supabase:
   - Storage → driver-photos → deve ter a foto
   - Table Editor → drivers → campo `photo_url` preenchido

### **Teste 2: Exibir foto (passageiro)**
1. No app do passageiro, use o componente:
   ```jsx
   <DriverAvatar driverId={1} size={60} />
   ```
2. Deve carregar e exibir a foto do motorista
3. Se não tiver foto, mostra ícone padrão

### **Teste 3: Fallback**
1. Use driverId de motorista sem foto
2. Deve mostrar ícone de pessoa
3. Sem erros no console

## 📦 Estrutura no Supabase Storage:

```
driver-photos/
└── drivers/
    ├── driver_1_1704067200000.jpg
    ├── driver_2_1704067201000.jpg
    └── driver_3_1704067202000.jpg
```

## 🚨 Troubleshooting:

### **Foto não aparece para o passageiro:**
- ✅ Verifique se o bucket é público: Storage → driver-photos → Settings → Public
- ✅ Confirme que `photo_url` está preenchido na tabela `drivers`
- ✅ Teste a URL diretamente no navegador

### **Erro ao fazer upload:**
- ✅ Verifique políticas do bucket (deve permitir upload autenticado)
- ✅ Confirme que o bucket `driver-photos` existe
- ✅ Veja logs do console para detalhes do erro

### **Avatar mostra loading infinito:**
- ✅ Verifique se `driverId` está sendo passado corretamente
- ✅ Confirme que o motorista existe na tabela `drivers`
- ✅ Veja console: "Erro ao buscar photo_url"

## 🎯 Próximos passos:

1. **Execute o SQL** (DRIVER_PHOTO_STORAGE_SETUP.sql)
2. **Teste upload** fazendo login como motorista
3. **Integre DriverAvatar** nas telas do passageiro
4. **Teste visualização** da foto

**Sistema de fotos completo! Motoristas enviam, passageiros veem! 📸✅**

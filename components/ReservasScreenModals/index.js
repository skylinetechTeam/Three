import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SlideModal } from '../BaseModal/ModalVariants';
import { ResponsiveButton, ResponsiveInput, ResponsiveCard } from '../ResponsiveUI';
import { useResponsive, useNotification } from '../../contexts/UIContext';
import { COLORS, SIZES, FONTS, RESPONSIVE } from '../../config/theme';

/**
 * ProgressiveReservationModal - Multi-step reservation form with smart validation
 */
export const ProgressiveReservationModal = ({
  visible,
  onClose,
  onSubmit,
  currentLocation,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    origem: '',
    destino: '',
    data: '',
    hora: '',
    tipoTaxi: 'Coletivo',
    observacoes: '',
    origemLat: null,
    origemLng: null,
    destinoLat: null,
    destinoLng: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();

  const totalSteps = 4;

  // Validation rules for each step
  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 1: // Locations
        if (!formData.origem.trim()) {
          errors.origem = 'Origem é obrigatória';
        }
        if (!formData.destino.trim()) {
          errors.destino = 'Destino é obrigatório';
        }
        break;
        
      case 2: // Date and Time
        if (!formData.data) {
          errors.data = 'Data é obrigatória';
        }
        if (!formData.hora) {
          errors.hora = 'Hora é obrigatória';
        }
        break;
        
      case 3: // Vehicle Type
        if (!formData.tipoTaxi) {
          errors.tipoTaxi = 'Tipo de veículo é obrigatório';
        }
        break;
        
      case 4: // Confirmation
        // Final validation
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      showNotification({
        type: 'success',
        title: 'Reserva criada',
        message: 'Sua reserva foi cadastrada com sucesso',
      });
      onClose();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível criar a reserva',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderLocationStep();
      case 2:
        return renderDateTimeStep();
      case 3:
        return renderVehicleStep();
      case 4:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Text style={[FONTS.styles.h3, styles.stepTitle]}>
        Locais da viagem
      </Text>
      
      <ResponsiveInput
        label="Origem"
        placeholder="De onde você vai sair?"
        value={formData.origem}
        onChangeText={(text) => updateFormData('origem', text)}
        icon="location"
        error={formErrors.origem}
      />
      
      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={() => {
          if (currentLocation) {
            updateFormData('origem', 'Minha localização atual');
            updateFormData('origemLat', currentLocation.latitude);
            updateFormData('origemLng', currentLocation.longitude);
          }
        }}
      >
        <Ionicons name="navigate" size={20} color={COLORS.primary[500]} />
        <Text style={styles.currentLocationText}>
          Usar minha localização atual
        </Text>
      </TouchableOpacity>
      
      <ResponsiveInput
        label="Destino"
        placeholder="Para onde você quer ir?"
        value={formData.destino}
        onChangeText={(text) => updateFormData('destino', text)}
        icon="flag"
        error={formErrors.destino}
      />
    </View>
  );

  const renderDateTimeStep = () => (
    <View style={styles.stepContent}>
      <Text style={[FONTS.styles.h3, styles.stepTitle]}>
        Quando você quer viajar?
      </Text>
      
      <ResponsiveInput
        label="Data"
        placeholder="Selecione a data"
        value={formData.data}
        onChangeText={(text) => updateFormData('data', text)}
        icon="calendar"
        error={formErrors.data}
      />
      
      <ResponsiveInput
        label="Horário"
        placeholder="Selecione o horário"
        value={formData.hora}
        onChangeText={(text) => updateFormData('hora', text)}
        icon="time"
        error={formErrors.hora}
      />
      
      <View style={styles.quickTimeContainer}>
        <Text style={[FONTS.styles.body2, styles.quickTimeLabel]}>
          Horários sugeridos:
        </Text>
        <View style={styles.quickTimeButtons}>
          {['06:00', '08:00', '12:00', '18:00'].map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.quickTimeButton,
                formData.hora === time && styles.quickTimeButtonActive
              ]}
              onPress={() => updateFormData('hora', time)}
            >
              <Text style={[
                styles.quickTimeButtonText,
                formData.hora === time && styles.quickTimeButtonTextActive
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderVehicleStep = () => {
    const vehicleTypes = [
      {
        id: 'Coletivo',
        name: 'Coletivo',
        description: 'Rota compartilhada, mais econômico',
        icon: '🚐',
        price: 'A partir de 300 Kz',
      },
      {
        id: 'Taxi Normal',
        name: 'Taxi Normal',
        description: 'Viagem individual, conforto padrão',
        icon: '🚗',
        price: 'A partir de 800 Kz',
      },
      {
        id: 'Taxi Executivo',
        name: 'Taxi Executivo',
        description: 'Veículo premium, máximo conforto',
        icon: '🚙',
        price: 'A partir de 1500 Kz',
      },
    ];

    return (
      <View style={styles.stepContent}>
        <Text style={[FONTS.styles.h3, styles.stepTitle]}>
          Escolha o tipo de veículo
        </Text>
        
        <View style={styles.vehicleList}>
          {vehicleTypes.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                formData.tipoTaxi === vehicle.id && styles.vehicleCardSelected
              ]}
              onPress={() => updateFormData('tipoTaxi', vehicle.id)}
            >
              <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
              <View style={styles.vehicleInfo}>
                <Text style={[FONTS.styles.body1, styles.vehicleName]}>
                  {vehicle.name}
                </Text>
                <Text style={[FONTS.styles.body2, styles.vehicleDescription]}>
                  {vehicle.description}
                </Text>
                <Text style={[FONTS.styles.caption, styles.vehiclePrice]}>
                  {vehicle.price}
                </Text>
              </View>
              {formData.tipoTaxi === vehicle.id && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={COLORS.semantic.success} 
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        <ResponsiveInput
          label="Observações (opcional)"
          placeholder="Alguma informação adicional?"
          value={formData.observacoes}
          onChangeText={(text) => updateFormData('observacoes', text)}
          multiline
          numberOfLines={3}
        />
      </View>
    );
  };

  const renderConfirmationStep = () => (
    <View style={styles.stepContent}>
      <Text style={[FONTS.styles.h3, styles.stepTitle]}>
        Confirme os detalhes
      </Text>
      
      <ResponsiveCard variant="flat" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Ionicons name="location" size={20} color={COLORS.text.light} />
          <View style={styles.summaryInfo}>
            <Text style={[FONTS.styles.caption, styles.summaryLabel]}>
              ORIGEM
            </Text>
            <Text style={[FONTS.styles.body1, styles.summaryValue]}>
              {formData.origem}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryRow}>
          <Ionicons name="flag" size={20} color={COLORS.text.light} />
          <View style={styles.summaryInfo}>
            <Text style={[FONTS.styles.caption, styles.summaryLabel]}>
              DESTINO
            </Text>
            <Text style={[FONTS.styles.body1, styles.summaryValue]}>
              {formData.destino}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryRow}>
          <Ionicons name="calendar" size={20} color={COLORS.text.light} />
          <View style={styles.summaryInfo}>
            <Text style={[FONTS.styles.caption, styles.summaryLabel]}>
              DATA E HORA
            </Text>
            <Text style={[FONTS.styles.body1, styles.summaryValue]}>
              {formData.data} às {formData.hora}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryRow}>
          <Ionicons name="car" size={20} color={COLORS.text.light} />
          <View style={styles.summaryInfo}>
            <Text style={[FONTS.styles.caption, styles.summaryLabel]}>
              VEÍCULO
            </Text>
            <Text style={[FONTS.styles.body1, styles.summaryValue]}>
              {formData.tipoTaxi}
            </Text>
          </View>
        </View>
        
        {formData.observacoes && (
          <View style={styles.summaryRow}>
            <Ionicons name="document-text" size={20} color={COLORS.text.light} />
            <View style={styles.summaryInfo}>
              <Text style={[FONTS.styles.caption, styles.summaryLabel]}>
                OBSERVAÇÕES
              </Text>
              <Text style={[FONTS.styles.body1, styles.summaryValue]}>
                {formData.observacoes}
              </Text>
            </View>
          </View>
        )}
      </ResponsiveCard>
      
      <View style={styles.confirmationNote}>
        <Ionicons name="information-circle" size={16} color={COLORS.text.light} />
        <Text style={[FONTS.styles.caption, styles.noteText]}>
          Sua reserva será confirmada e você receberá os detalhes do motorista próximo ao horário agendado.
        </Text>
      </View>
    </View>
  );

  return (
    <SlideModal
      visible={visible}
      onClose={onClose}
      title="Nova Reserva"
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={currentStep < totalSteps ? handleNext : handleSubmit}
      onPrevious={currentStep > 1 ? handlePrevious : undefined}
      nextTitle={currentStep === totalSteps ? (isSubmitting ? "Criando..." : "Confirmar") : "Próximo"}
      canGoNext={!isSubmitting}
      canGoPrevious={!isSubmitting}
    >
      {renderStepContent()}
    </SlideModal>
  );
};

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
    gap: SIZES.spacing.lg,
  },
  
  stepTitle: {
    textAlign: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.primary[50],
    borderRadius: SIZES.radius.medium,
    gap: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.md,
  },
  
  currentLocationText: {
    color: COLORS.primary[700],
    fontWeight: '500',
  },
  
  quickTimeContainer: {
    marginTop: SIZES.spacing.lg,
  },
  
  quickTimeLabel: {
    marginBottom: SIZES.spacing.md,
    color: COLORS.text.secondary,
  },
  
  quickTimeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.sm,
  },
  
  quickTimeButton: {
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.card,
  },
  
  quickTimeButtonActive: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  
  quickTimeButtonText: {
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  quickTimeButtonTextActive: {
    color: COLORS.primary[700],
  },
  
  vehicleList: {
    gap: SIZES.spacing.md,
  },
  
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.card,
    gap: SIZES.spacing.md,
  },
  
  vehicleCardSelected: {
    borderColor: COLORS.semantic.success,
    backgroundColor: COLORS.semantic.successLight,
  },
  
  vehicleIcon: {
    fontSize: 32,
  },
  
  vehicleInfo: {
    flex: 1,
  },
  
  vehicleName: {
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  
  vehicleDescription: {
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.xs,
  },
  
  vehiclePrice: {
    color: COLORS.semantic.success,
    fontWeight: '600',
  },
  
  summaryCard: {
    gap: SIZES.spacing.lg,
  },
  
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.spacing.md,
  },
  
  summaryInfo: {
    flex: 1,
  },
  
  summaryLabel: {
    color: COLORS.text.light,
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  
  summaryValue: {
    color: COLORS.text.primary,
  },
  
  confirmationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.spacing.sm,
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.semantic.infoLight,
    borderRadius: SIZES.radius.medium,
  },
  
  noteText: {
    flex: 1,
    color: COLORS.text.light,
    lineHeight: 18,
  },
});

export default ProgressiveReservationModal;
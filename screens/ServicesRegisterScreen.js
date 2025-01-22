import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../supabaseClient';

const ServicesRegisterScreen = () => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [disponivel, setDisponivel] = useState(false);

  const cadastrarServico = async () => {
    if (!nome || !descricao || !preco) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const { data, error } = await supabase.from('servicos').insert([
        {
          nome,
          descricao,
          preco: parseFloat(preco),
          disponivel,
        },
      ]);

      if (error) {
        console.error(error);
        Alert.alert('Erro', 'Não foi possível cadastrar o serviço.');
      } else {
        Alert.alert('Sucesso', 'Serviço cadastrado com sucesso!');
        setNome('');
        setDescricao('');
        setPreco('');
        setDisponivel(false);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Cadastrar Serviço</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome do serviço"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="Descrição"
        value={descricao}
        onChangeText={setDescricao}
      />

      <TextInput
        style={styles.input}
        placeholder="Preço"
        value={preco}
        onChangeText={setPreco}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setDisponivel(!disponivel)}
      >
        <View style={[styles.checkbox, disponivel && styles.checkboxChecked]} />
        <Text style={styles.checkboxLabel}>Disponível</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={cadastrarServico}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ServicesRegisterScreen;

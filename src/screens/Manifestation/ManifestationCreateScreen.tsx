import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ManifestationEntry } from '../../types';

const ManifestationCreateScreen = () => {
  const { saveManifestationEntry, updateManifestationEntry, state } = useApp();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Check if we're editing an existing manifestation
  const params = route.params as any;
  const manifestationParam = params?.manifestation;
  const existingManifestation = manifestationParam ? {
    ...manifestationParam,
    createdAt: typeof manifestationParam.createdAt === 'string' 
      ? new Date(manifestationParam.createdAt) 
      : manifestationParam.createdAt,
    completedAt: manifestationParam.completedAt && typeof manifestationParam.completedAt === 'string'
      ? new Date(manifestationParam.completedAt)
      : manifestationParam.completedAt,
  } as ManifestationEntry : undefined;
  const isEditing = !!existingManifestation;
  
  const [title, setTitle] = useState(existingManifestation?.title || '');
  const [description, setDescription] = useState(existingManifestation?.description || '');
  const [category, setCategory] = useState(existingManifestation?.category || 'Personal');
  const [isLoading, setIsLoading] = useState(false);


  const categories = ['Personal', 'Career', 'Health', 'Relationships', 'Financial', 'Spiritual'];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your manifestation');
      return;
    }


    setIsLoading(true);
    
    try {
      if (isEditing && existingManifestation) {
        // Update existing manifestation
        await updateManifestationEntry(existingManifestation.id, {
          title: title.trim(),
          description: description.trim(),
          category,
        });
      } else {
        // Create new manifestation
        await saveManifestationEntry({
          title: title.trim(),
          description: description.trim(),
          category,
          isCompleted: false,
          visualizationNotes: '',
          affirmations: [],
        });
        
      }

      const message = isEditing 
        ? 'Your manifestation has been updated!' 
        : 'Your manifestation has been created!';
      
      Alert.alert('Success', message, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving manifestation:', error);
      Alert.alert('Error', 'Failed to save your manifestation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Manifestation' : 'New Manifestation'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!title.trim() || isLoading) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!title.trim() || isLoading}
        >
          <Text style={[
            styles.saveButtonText,
            (!title.trim() || isLoading) && styles.saveButtonTextDisabled
          ]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What do you want to manifest?"
              value={title}
              onChangeText={setTitle}
              autoFocus
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category (optional)</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.selectedCategoryButton,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat && styles.selectedCategoryButtonText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your manifestation in detail... What does it look like when it comes true?"
              multiline
              numberOfLines={8}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {description.length}/1000 characters
            </Text>
          </View>

          <View style={styles.helpContainer}>
            <Ionicons name="bulb" size={20} color="#6366f1" />
            <Text style={styles.helpText}>
              Be specific and write in present tense as if it's already happening.
            </Text>
          </View>
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cancelButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedCategoryButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  helpText: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default ManifestationCreateScreen;
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ManifestationEntry, RootStackParamList } from '../../types';

type ManifestationCreateScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ManifestationCreate'
>;

const ManifestationCreateScreen = () => {
  const { saveManifestationEntry, updateManifestationEntry, deleteManifestationEntry, state } = useApp();
  const navigation = useNavigation<ManifestationCreateScreenNavigationProp>();
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
    // Prevent multiple saves
    if (isLoading) {
      console.log('Save already in progress, ignoring duplicate call');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your manifestation');
      return;
    }
    
    console.log('Starting save process...', { isEditing, existingManifestation: !!existingManifestation });
    setIsLoading(true);
    
    try {
      if (isEditing && existingManifestation) {
        console.log('Updating existing manifestation:', existingManifestation.id);
        await updateManifestationEntry(existingManifestation.id, {
          title: title.trim(),
          description: description.trim(),
          category,
        });
      } else {
        console.log('Creating new manifestation');
        await saveManifestationEntry({
          title: title.trim(),
          description: description.trim(),
          category,
          isCompleted: false,
          visualizationNotes: '',
          affirmations: [],
        });
      }

      console.log('Save successful, navigating back...');
      setIsLoading(false);

      // Navigate directly to manifestation list, skipping any detail screens
      try {
        console.log('Navigating directly to Manifestation tab to avoid stale detail screen');
        navigation.navigate('MainTabs', { screen: 'Manifestation' } as any);
      } catch (navError) {
        console.error('Navigation error:', navError);
        console.log('Using navigation reset as fallback');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }

    } catch (error) {
      console.error('Error saving manifestation:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to save your manifestation. Please try again.');
    }
  };

  const handleCancel = () => {
    const navigateBack = () => {
      try {
        // When cancelling from edit screen, we can go back to detail screen
        // since we didn't make any changes
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('MainTabs', { screen: 'Manifestation' } as any);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    };

    if (title.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', onPress: navigateBack },
        ]
      );
    } else {
      navigateBack();
    }
  };

  const handleDelete = () => {
    if (!isEditing || !existingManifestation) {
      console.log('Delete blocked: isEditing=', isEditing, 'existingManifestation=', !!existingManifestation);
      return;
    }
    
    console.log('Starting delete process for manifestation:', existingManifestation.id);
    
    // Check if we're in a web environment and handle accordingly
    const isWeb = typeof window !== 'undefined' && window.confirm;
    
    if (isWeb) {
      console.log('Using web confirm dialog');
      const confirmed = window.confirm('Are you sure you want to delete this manifestation? This action cannot be undone.');
      if (confirmed) {
        console.log('User confirmed delete via web confirm');
        performDelete();
      } else {
        console.log('User cancelled delete via web confirm');
      }
    } else {
      console.log('Using React Native Alert.alert');
      Alert.alert(
        'Delete Manifestation',
        'Are you sure you want to delete this manifestation? This action cannot be undone.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => console.log('User cancelled delete via Alert')
          },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              console.log('User confirmed delete via Alert');
              performDelete();
            }
          },
        ]
      );
    }
  };

  const performDelete = async () => {
    try {
      console.log('User confirmed delete, starting deletion...');
      setIsLoading(true);
      
      console.log('Calling deleteManifestationEntry with id:', existingManifestation!.id);
      await deleteManifestationEntry(existingManifestation!.id);
      console.log('Delete successful, navigating back...');
      
      // Navigate immediately after successful deletion
      setIsLoading(false);
      
      try {
        console.log('Navigating directly to Manifestation tab to avoid stale detail screen');
        navigation.navigate('MainTabs', { screen: 'Manifestation' } as any);
      } catch (navError) {
        console.error('Navigation error:', navError);
        console.log('Using navigation reset as fallback');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
      
    } catch (error) {
      console.error('Error deleting manifestation:', error);
      setIsLoading(false);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Failed to delete your manifestation. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to delete your manifestation. Please try again.');
      }
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

          {isEditing && (
            <TouchableOpacity 
              style={[styles.deleteButton, isLoading && styles.deleteButtonDisabled]} 
              onPress={handleDelete}
              disabled={isLoading}
            >
              <Ionicons name="trash" size={20} color={isLoading ? "#9ca3af" : "#dc2626"} />
              <Text style={[styles.deleteButtonText, isLoading && styles.deleteButtonTextDisabled]}>
                {isLoading ? 'Deleting...' : 'Delete Manifestation'}
              </Text>
            </TouchableOpacity>
          )}
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  deleteButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export default ManifestationCreateScreen;
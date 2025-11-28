import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { auth, db, storage } from '../firebaseconfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AddProductScreen({ navigation }) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera permissions to take a photo.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadImageAsync = async (uri) => {
        if (!auth.currentUser) {
             throw new Error("User is not logged in.");
        }

        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const fileRef = ref(storage, `productImages/${auth.currentUser.uid}_${Date.now()}`);
            await uploadBytes(fileRef, blob);
            
            return await getDownloadURL(fileRef);
        } catch (error) {
            console.error("Image Upload Failed:", error);
            throw error;
        }
    };

    const handleAddProduct = async () => {
        if (!name || !price || !quantity || !image) {
            return Alert.alert("Missing Fields", "Please fill in all fields and select an image.");
        }

        if (!auth.currentUser) {
            return Alert.alert("Error", "You must be logged in to list a product.");
        }

        setUploading(true);
        try {
            const imageUrl = await uploadImageAsync(image);
            
            await addDoc(collection(db, "products"), {
                farmerId: auth.currentUser.uid,
                name,
                price: parseFloat(price),
                quantity,
                description,
                imageUrl,
                createdAt: serverTimestamp(),
            });
            
            setUploading(false);
            Alert.alert("Success", "Your product has been listed successfully!");
            navigation.goBack();
        } catch (error) {
            console.error("Full Error:", error);
            setUploading(false);
            Alert.alert("Error", "There was a problem listing your product.");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.title}>List a New Product</Text>
                    
                    <TouchableOpacity style={styles.imagePicker} onPress={takePhoto}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.productImage} />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="camera" size={40} color="#888" />
                                <Text style={styles.imagePickerText}>Tap to take a photo</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TextInput placeholder="Product Name (e.g., Fresh Tomatoes)" style={styles.input} value={name} onChangeText={setName} />
                    <TextInput placeholder="Price (per kg/unit)" style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
                    <TextInput placeholder="Quantity Available (e.g., 50 kg)" style={styles.input} value={quantity} onChangeText={setQuantity} />
                    <TextInput placeholder="Description" style={[styles.input, styles.textArea]} multiline value={description} onChangeText={setDescription} />

                    <TouchableOpacity style={styles.button} onPress={handleAddProduct} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>List Product</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    imagePicker: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    productImage: { width: '100%', height: '100%', borderRadius: 10 },
    imagePickerText: { marginTop: 10, color: '#555' },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
    button: {
        width: '100%',
        padding: 15,
        backgroundColor: '#2E8B57',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
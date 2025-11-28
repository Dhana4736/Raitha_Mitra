import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'; // Added deleteDoc
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView, Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import { auth, db, storage } from '../firebaseconfig';

export default function EditProductScreen({ route, navigation }) {
    const { product } = route.params; 

    const [name, setName] = useState(product.name);
    const [price, setPrice] = useState(product.price.toString());
    const [quantity, setQuantity] = useState(product.quantity);
    const [description, setDescription] = useState(product.description);
    const [image, setImage] = useState(product.imageUrl); 
    const [isNewImage, setIsNewImage] = useState(false);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setIsNewImage(true); 
        }
    };
    
    const uploadImageAsync = async (uri) => {
        if (!auth.currentUser) throw new Error("User not logged in");

        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = (e) => {
                console.log(e);
                reject(new TypeError("Network request failed"));
            };
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });
    
        const fileRef = ref(storage, `productImages/${auth.currentUser.uid}_${Date.now()}`);
        await uploadBytes(fileRef, blob);
        blob.close();
        return await getDownloadURL(fileRef);
    };

    const handleUpdateProduct = async () => {
        if (!name || !price || !quantity) {
            return Alert.alert("Missing Fields", "Please fill in the name, price, and quantity.");
        }

        if (!auth.currentUser) {
            return Alert.alert("Error", "You must be logged in to update a product.");
        }

        setUploading(true);
        try {
            let imageUrl = image;
            if (isNewImage) {
                imageUrl = await uploadImageAsync(image);
            }

            const productRef = doc(db, "products", product.id);
            await updateDoc(productRef, {
                name,
                price: parseFloat(price),
                quantity,
                description,
                imageUrl, 
            });
            
            setUploading(false);
            Alert.alert("Success", "Your product has been updated successfully!");
            navigation.goBack(); 
        } catch (error) {
            console.error("Error updating product: ", error);
            setUploading(false);
            Alert.alert("Error", "There was a problem updating your product.");
        }
    };

    // --- NEW: Handle Delete Logic ---
    const handleDeleteProduct = () => {
        Alert.alert(
            "Delete Product",
            "Are you sure you want to delete this product? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive", // Shows red on iOS
                    onPress: async () => {
                        setUploading(true);
                        try {
                            await deleteDoc(doc(db, "products", product.id));
                            Alert.alert("Deleted", "Product has been removed successfully.");
                            navigation.goBack();
                        } catch (error) {
                            console.error("Error deleting product:", error);
                            Alert.alert("Error", "Could not delete product.");
                        } finally {
                            setUploading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.title}>Edit Product</Text>
                    
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.productImage} />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="camera" size={40} color="#888" />
                                <Text style={styles.imagePickerText}>Tap to change image</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TextInput placeholder="Product Name" style={styles.input} value={name} onChangeText={setName} />
                    <TextInput placeholder="Price (per kg/unit)" style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
                    <TextInput placeholder="Quantity Available (e.g., 50 kg)" style={styles.input} value={quantity} onChangeText={setQuantity} />
                    <TextInput placeholder="Description" style={[styles.input, styles.textArea]} multiline value={description} onChangeText={setDescription} />

                    <TouchableOpacity style={styles.button} onPress={handleUpdateProduct} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>

                    {/* --- NEW: Delete Button --- */}
                    <TouchableOpacity 
                        style={[styles.button, styles.deleteButton]} 
                        onPress={handleDeleteProduct} 
                        disabled={uploading}
                    >
                        <Text style={styles.buttonText}>Delete Product</Text>
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
    // New style for delete button
    deleteButton: {
        backgroundColor: '#FF4444', // Red color for danger action
        marginTop: 15,
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
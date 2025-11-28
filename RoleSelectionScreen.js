import { useEffect, useState } from 'react';
import { Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- Image Slideshow Data ---
// IMPORTANT: Make sure the paths below match the location of your images in the 'assets' folder.
const farmerImages = [
    require('../assets/farmer1.jpg'),
    // require('../assets/farmer2.jpg'),
    // require('../assets/farmer3.jpg'),
    // require('../assets/farmer4.jpg'),
];

const customerImages = [
    require('../assets/customer1.jpg'),
    // require('../assets/customer2.jpg'),
    // require('../assets/customer3.jpg'),
];

// --- Multilingual Text Data ---
const farmerTitles = [
    "I am a Farmer",       // English
    // "నేను రైతును",         // Telugu
    // "ನಾನು ರೈತ",            // Kannada
    // "मैं एक किसान हूँ",     // Hindi
    // "நான் ஒரு விவசாயி",    // Tamil
];

const customerTitles = [
    "I am a Customer",     // English
    // "నేను వినియోగదారుడిని", // Telugu
    // "ನಾನು ಗ್ರಾಹಕ",          // Kannada
    // "मैं एक ग्राहक हूँ",    // Hindi
    // "நான் ஒரு வாடிக்கையாளர்", // Tamil
];

export default function RoleSelectionScreen({ navigation }) {
    const [farmerImageIndex, setFarmerImageIndex] = useState(0);
    const [customerImageIndex, setCustomerImageIndex] = useState(0);
    const [languageIndex, setLanguageIndex] = useState(0);

    // This useEffect hook handles both the image and language slideshows
    useEffect(() => {
        const imageTimer = setInterval(() => {
            setFarmerImageIndex(prevIndex => (prevIndex + 1) % farmerImages.length);
            setCustomerImageIndex(prevIndex => (prevIndex + 1) % customerImages.length);
        }, 3000); // Change image every 3 seconds

        const languageTimer = setInterval(() => {
            setLanguageIndex(prevIndex => (prevIndex + 1) % farmerTitles.length);
        }, 2000); // Change language every 2 seconds

        // Cleanup timers when the component unmounts
        return () => {
            clearInterval(imageTimer);
            clearInterval(languageTimer);
        };
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Image
                source={require('../assets/splash-icon.png')}
                style={styles.logo}
            />
            <Text style={styles.title}>Choose Your Role</Text>
            <Text style={styles.subtitle}>How will you be using RaithaMitra?</Text>

            <View style={styles.cardContainer}>
                {/* Farmer Card */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('SignUp', { role: 'Farmer' })}
                >
                    <ImageBackground
                        source={farmerImages[farmerImageIndex]}
                        style={styles.cardBackground}
                        imageStyle={{ borderRadius: 15 }}
                    >
                        <View style={styles.overlay}>
                            <Text style={styles.cardText}>{farmerTitles[languageIndex]}</Text>
                        </View>
                    </ImageBackground>
                </TouchableOpacity>

                {/* Customer Card */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('SignUp', { role: 'Customer' })}
                >
                    <ImageBackground
                        source={customerImages[customerImageIndex]}
                        style={styles.cardBackground}
                        imageStyle={{ borderRadius: 15 }}
                    >
                        <View style={styles.overlay}>
                            <Text style={styles.cardText}>{customerTitles[languageIndex]}</Text>
                        </View>
                    </ImageBackground>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.signInText}>
                    Already have an account? <Text style={{ color: '#006400', fontWeight: 'bold' }}>Sign In</Text>
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5DC',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'gray',
        marginBottom: 30,
        textAlign: 'center',
    },
    cardContainer: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: '95%',
        height: 180,
        marginBottom: 25,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    cardBackground: {
        flex: 1,
        justifyContent: 'flex-end', // Positions the overlay at the bottom
    },
    overlay: {
        backgroundColor: 'rgba(0,0,0,0.4)', // Darkness reduced from 0.6 to 0.4
        width: '100%', // Width increased to span the full card
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 15, // Match the card's border radius
        borderBottomRightRadius: 15, // Match the card's border radius
    },
    cardText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    signInText: {
        marginTop: 10,
        fontSize: 16,
    },
});


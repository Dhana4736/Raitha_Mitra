import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';
import { translations } from '../constants/translations';
import SpeechButton from '../components/SpeechButton';

const languages = [
    { label: 'English', value: 'en' },
    { label: 'ಕನ್ನಡ (Kannada)', value: 'kn' },
    { label: 'తెలుగు (Telugu)', value: 'te' },
    { label: 'हिन्दी (Hindi)', value: 'hi' },
    { label: 'தமிழ் (Tamil)', value: 'ta' },
];

export default function FarmerHomeScreen({ userData }) {
    const navigation = useNavigation();
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [langModalVisible, setLangModalVisible] = useState(false);

    const langCode = userData?.preferredLanguage || 'en';
    const t = translations[langCode] || translations.en;

    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", auth.currentUser.uid),
            where("read", "==", false)
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setUnreadNotifications(querySnapshot.size);
        });
        return () => unsubscribe();
    }, []);

    const handleLanguageChange = async (newLang) => {
        if (auth.currentUser) {
            try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                await updateDoc(userRef, { preferredLanguage: newLang });
                setLangModalVisible(false);
            } catch (error) {
                console.error("Error updating language:", error);
                alert("Failed to update language");
            }
        }
    };

    const GridButton = ({ iconLib, iconName, label, onPress }) => {
        const IconTag = iconLib === 'Octicons' ? Octicons : MaterialCommunityIcons;
        return (
            <TouchableOpacity style={styles.gridButton} onPress={onPress}>
                <IconTag name={iconName} size={40} color="#2E8B57" />
                <View style={styles.labelRow}>
                    <Text style={styles.gridButtonText}>{label}</Text>
                    <View onStartShouldSetResponder={() => true}>
                        <SpeechButton text={label} language={langCode} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>RaithaMitra</Text>
                <View style={styles.headerIcons}>
                    {/* --- HEADER NAV ICONS --- */}
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('FarmerOrders')}>
                        <MaterialCommunityIcons name="package-variant-closed" size={24} color="#333" />
                    </TouchableOpacity>

                    {/* Removed Payment History Icon from here as requested */}

                    <TouchableOpacity style={styles.iconButton} onPress={() => setLangModalVisible(true)}>
                        <MaterialCommunityIcons name="translate" size={24} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                        <Octicons name="bell" size={24} color="#333" />
                        {unreadNotifications > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadNotifications}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => navigation.navigate('My Profile')}>
                        {userData?.photoURL ? (
                            <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profilePlaceholder}>
                                <Octicons name="person" size={24} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.welcomeContainer}>
                    <View style={{flex: 1}}>
                        <Text style={styles.welcomeTitle}>{t.welcome}, {userData?.name || "Farmer"}!</Text>
                        <Text style={styles.subtitle}>{t.manageFarm}</Text>
                    </View>
                    <SpeechButton text={`${t.welcome} ${userData?.name || "Farmer"}. ${t.manageFarm}`} language={langCode} />
                </View>
                
                <View style={styles.actionGrid}>
                    <GridButton 
                        iconLib="MaterialCommunityIcons" iconName="sprout" 
                        label={t.addProduct} onPress={() => navigation.navigate('AddProduct')} 
                    />
                    <GridButton 
                        iconLib="Octicons" iconName="list-unordered" 
                        label={t.myListings} onPress={() => navigation.navigate('Listings')} 
                    />
                    <GridButton 
                        iconLib="MaterialCommunityIcons" iconName="package-variant-closed" 
                        label={t.viewOrders} onPress={() => navigation.navigate('FarmerOrders')} 
                    />
                    
                    <GridButton 
                        iconLib="MaterialCommunityIcons" iconName="weather-partly-cloudy" 
                        label={t.weather} onPress={() => navigation.navigate('Weather')} 
                    />
                    <GridButton 
                        iconLib="MaterialCommunityIcons" iconName="seed" 
                        label={t.cropSuggestions} onPress={() => navigation.navigate('CropRecommendation')} 
                    />
                    
                    <GridButton 
                        iconLib="MaterialCommunityIcons" iconName="basket-outline" 
                        label={t.communityBasket} onPress={() => navigation.navigate('CommunityBasket')} 
                    />
                    
                    <GridButton 
                        iconLib="MaterialCommunityIcons" iconName="cash-multiple" 
                        label={t.paymentHistory} onPress={() => navigation.navigate('PaymentHistory')} 
                    />

                    <GridButton 
                        iconLib="MaterialCommunityIcons" iconName="truck-delivery-outline" 
                        label={t.logistics} onPress={() => navigation.navigate('Logistics')} 
                    />

                    <GridButton 
                        iconLib="MaterialCommunityIcons" iconName="comment-quote-outline" 
                        label={t.userFeedbacks} onPress={() => navigation.navigate('UserFeedbacks')} 
                    />

                    <GridButton 
                        iconLib="MaterialCommunityIcons" iconName="information-outline" 
                        label={t.aboutApp} onPress={() => navigation.navigate('About')} 
                    />
                </View>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={langModalVisible}
                onRequestClose={() => setLangModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Select Language</Text>
                        {languages.map((lang) => (
                            <TouchableOpacity 
                                key={lang.value} 
                                style={styles.langOption} 
                                onPress={() => handleLanguageChange(lang.value)}
                            >
                                <Text style={[
                                    styles.langText, 
                                    langCode === lang.value && styles.activeLangText
                                ]}>
                                    {lang.label}
                                </Text>
                                {langCode === lang.value && (
                                    <Octicons name="check" size={20} color="#2E8B57" />
                                )}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => setLangModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>{t.close || "Close"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 20,
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E8B57' },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { marginRight: 15, position: 'relative' },
    badge: {
        position: 'absolute', right: -6, top: -3,
        backgroundColor: 'red', borderRadius: 8,
        width: 16, height: 16,
        justifyContent: 'center', alignItems: 'center',
    },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    profileImage: { width: 35, height: 35, borderRadius: 17.5 },
    profilePlaceholder: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
    container: { padding: 20 },
    welcomeContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 20 
    },
    welcomeTitle: { fontSize: 28, fontWeight: 'bold' },
    subtitle: { fontSize: 16, color: 'gray' },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridButton: { 
        width: '48%', 
        backgroundColor: '#fff', 
        paddingVertical: 20,
        paddingHorizontal: 5,
        borderRadius: 10, 
        alignItems: 'center', 
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        flexWrap: 'wrap'
    },
    gridButtonText: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center' },
    
    modalContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)' 
    },
    modalView: { 
        width: '80%', 
        backgroundColor: 'white', 
        borderRadius: 15, 
        padding: 20, 
        elevation: 5 
    },
    modalTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 20, 
        textAlign: 'center',
        color: '#333'
    },
    langOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    langText: { fontSize: 16, color: '#555' },
    activeLangText: { color: '#2E8B57', fontWeight: 'bold' },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#2E8B57',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    closeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
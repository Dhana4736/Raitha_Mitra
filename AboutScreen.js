import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/splash-icon.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.appName}>RaithaMitra</Text>
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Us</Text>
                    <Text style={styles.text}>
                        RaithaMitra is a comprehensive platform designed to empower farmers by connecting them directly with customers, providing vital agricultural information, and facilitating a supportive community.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Mission</Text>
                    <Text style={styles.text}>
                        To eliminate middlemen, ensure fair pricing for farmers, and provide consumers with fresh, locally grown produce.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Features</Text>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureBullet}>•</Text>
                        <Text style={styles.text}>Direct Farmer-to-Consumer Marketplace</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureBullet}>•</Text>
                        <Text style={styles.text}>Real-time Weather Updates</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureBullet}>•</Text>
                        <Text style={styles.text}>Smart Crop Recommendations</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureBullet}>•</Text>
                        <Text style={styles.text}>Community Pooling & Logistics Support</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <Text style={styles.text}>Email: support@raithamitra.com</Text>
                    <Text style={styles.text}>Phone: +91 98765 43210</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    logoContainer: { alignItems: 'center', marginBottom: 30 },
    logo: { width: 100, height: 100, borderRadius: 20, marginBottom: 10 },
    appName: { fontSize: 28, fontWeight: 'bold', color: '#2E8B57' },
    version: { fontSize: 14, color: '#888' },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    text: { fontSize: 16, color: '#555', lineHeight: 24 },
    featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
    featureBullet: { fontSize: 16, color: '#2E8B57', marginRight: 10, marginTop: 2 },
});
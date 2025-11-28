import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORIES = [
    {
        id: '1',
        farmer: 'Ramesh Gowda',
        location: 'Mandya, Karnataka',
        title: 'From Debt to Profit using Organic Farming',
        story: 'Ramesh switched to organic farming methods for his sugarcane crop. By reducing chemical inputs and using the RaithaMitra app to find direct buyers, he increased his profit margin by 40%.',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Sugarcane_fields_in_Bangladesh.jpg/640px-Sugarcane_fields_in_Bangladesh.jpg'
    },
    {
        id: '2',
        farmer: 'Lakshmi Devi',
        location: 'Kolar, Karnataka',
        title: 'Modernizing Tomato Cultivation',
        story: 'Lakshmi used precision irrigation techniques suggested by experts. She now harvests 30 tons of tomatoes per acre, compared to 18 tons previously.',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/640px-Tomato_je.jpg'
    },
    {
        id: '3',
        farmer: 'Shivanna',
        location: 'Haveri, Karnataka',
        title: 'Community Selling Success',
        story: 'Shivanna organized 10 local farmers to pool their cotton harvest. They negotiated a bulk deal with a textile mill through the RaithaMitra community basket feature.',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Cotton_plant.jpg/640px-Cotton_plant.jpg'
    }
];

export default function SuccessStoriesScreen() {
    const renderStory = ({ item }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>By {item.farmer} • {item.location}</Text>
                <Text style={styles.storyText}>{item.story}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={STORIES}
                keyExtractor={item => item.id}
                renderItem={renderStory}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    list: { padding: 15 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    cardImage: { width: '100%', height: 200 },
    cardContent: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#2E8B57', marginBottom: 8 },
    meta: { fontSize: 14, color: '#666', marginBottom: 12, fontStyle: 'italic' },
    storyText: { fontSize: 16, color: '#333', lineHeight: 24 },
});
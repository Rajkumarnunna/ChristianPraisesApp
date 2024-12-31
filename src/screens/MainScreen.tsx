import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Share,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Text,
  NetInfo,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MainScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedHtml, setCachedHtml] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const webViewRef = useRef(null);
  
  const WEB_URL = 'https://scarlet-flss-2.tiiny.site/';

  // Cache management
  const cacheWebContent = async (html) => {
    try {
      await AsyncStorage.setItem('cached_content', html);
    } catch (error) {
      console.error('Caching failed:', error);
    }
  };

  const loadCachedContent = async () => {
    try {
      const cached = await AsyncStorage.getItem('cached_content');
      if (cached) {
        setCachedHtml(cached);
      }
    } catch (error) {
      console.error('Loading cache failed:', error);
    }
  };

  // Network status monitoring
  React.useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const state = await NetInfo.fetch();
        setIsOffline(!state.isConnected);
        if (!state.isConnected) {
          loadCachedContent();
        }
      } catch (error) {
        console.error('Network check failed:', error);
      }
    };

    checkConnectivity();
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out these Christian Praises!',
        url: WEB_URL,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
    setRefreshing(false);
  }, []);

  const injectedJavaScript = `
    // Cache the content when loaded
    window.ReactNativeWebView.postMessage(document.documentElement.outerHTML);
    true;
  `;

  const handleMessage = (event) => {
    cacheWebContent(event.nativeEvent.data);
  };

  if (isOffline && !cachedHtml) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No internet connection</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={isOffline ? { html: cachedHtml } : { uri: WEB_URL }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        pullToRefreshEnabled={true}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Icon name="share-social" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  shareButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default MainScreen; 
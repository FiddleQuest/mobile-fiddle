import React, { useState, useEffect, useLayoutEffect } from 'react';
import {Text, View, StyleSheet, Image, TouchableOpacity, Platform, ActivityIndicator} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import UploadProgresses from '../components/uploadProgresses';
import { backgroundMain, backgroundGray, iconFont, backgroundTitle } from '../colorSets';
import WhiteMenu from '../components/icons/whitemenu';
import CameraIcon from '../components/icons/camera';
import { useNavigation } from '@react-navigation/native';
import get from 'lodash/get';
import uploadsStore from "../mobx/uploadsStore";
import {UIImagePickerPreferredAssetRepresentationMode} from "expo-image-picker";

const UploadIcon = Platform.select({
  ios: () => require('../components/icons/iosUploadIcon').default,
  android: () => require('../components/icons/uploadIcon').default,
})();

const isAndroid = Platform.OS === 'android';

const styles = StyleSheet.create({
  title: {
    padding: 10,
    paddingLeft: 17,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: backgroundMain,
    width: '100%',
    height: '100%',
  },
  list: {
    height: '60%',
    flex: 1,
    width: '90%',
    margin: 30,
    alignSelf: 'center',
  },
  upload: {
    flex: 0,
    flexDirection: 'row',
    margin: 30,
    width: '90%',
    maxHeight: '30%',
    height: '30%',
    padding: 10,
  },
  gallery: {
    flex: 1,
    flexDirection: 'column',
    width: '50%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    flexDirection: 'column',
    width: '50%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    flex: 0,
    backgroundColor: backgroundGray,
    borderRadius: 10,
  },
  text: {
    fontSize: 16,
    color: iconFont,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  watermark: {
    position: 'absolute',
    top: '-5%',
    left: 0,
    width: '100%',
    height: '100%',
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 5,
    fontSize: 40,
  },
  iconContainer: {
    width: '45%',
    maxHeight: '60%',
    flex: 1,
    aspectRatio: 1,
    marginBottom: 10,
  },
  activityIndicatorContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255, .5)',
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }
});

let initialCleanupDone = false;

const UploadPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Upload Queue',
      headerStyle: {
        backgroundColor: backgroundTitle, //Set Header color
      },
      headerTintColor: '#fff', //Set Header text color
      headerTitleAlign: 'center',
      headerLeft: () => (
        <TouchableOpacity style={styles.title} onPress={() => navigation.navigate('Settings')}>
          <WhiteMenu />
        </TouchableOpacity>
      ),
      headerRight: () => (<View />),
    });
  }, [navigation]);

  useEffect(() => {
    if (initialCleanupDone) return;
    FileSystem.readDirectoryAsync(FileSystem.cacheDirectory).then(res => {
      console.log('cache', res);
      if (res) res.map(cat => {
        initialCleanupDone = true;
        FileSystem.deleteAsync(FileSystem.cacheDirectory + cat).then(() => console.log(cat, 'cleared'));
      })
    }) // video files stay in cache if upload progress wasn't ended
  }, []);

  const pickVideo = async () => {
    // No permissions request is necessary for launching the image library
    setIsLoading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Current,
    });
    if (!result.canceled) {
      setIsLoading(false);
      const potentialVideoInfo = get(result, ['assets', '0']);
      uploadsStore.videoFileSelected(potentialVideoInfo.uri);
      navigation.navigate('CachingVideo', { videoInfo: potentialVideoInfo});
    } else {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size={100} color='#4C92C1' />
        <Text style={styles.text}>Loading selected video...</Text>
      </View>}
      <View style={styles.watermark}>
        <Image
          style={{ flex:1, height: undefined, width: undefined }}
          resizeMode="contain"
          source={require('../assets/wordmark-for-main-page.png')}
        />
      </View>
      <View style={styles.list}>
        <View style={styles.background}>
          <UploadProgresses />
        </View>
      </View>
      <View style={[styles.upload, styles.background]}>
        <TouchableOpacity
          style={styles.gallery}
          onPress={pickVideo}
        >
          <View style={styles.iconContainer}>
            <UploadIcon />
          </View>
          <Text style={styles.text}>{`Upload from\n${isAndroid ? 'Gallery' : 'Camera Roll'}`}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.camera}
          onPress={() => navigation.navigate('CameraMode')}
        >
          <View style={styles.iconContainer}>
            <CameraIcon />
          </View>
          <Text style={[styles.text, styles.bold]}>Shoot new{"\n"}video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default UploadPage;

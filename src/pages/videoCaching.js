import React, { useEffect } from 'react';
import { Text, View, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import Meteor from '@meteorrn/core';
import get from 'lodash/get';
import { accountType, childrenIds, TEACHER, STUDENT } from "../lib/utils";
import * as MediaLibrary from 'expo-media-library';
import { useKeepAwake } from 'expo-keep-awake';
import { useNavigation, useRoute } from '@react-navigation/native';
import appStore from '../mobx/appStore';

const isAndroid = Platform.OS === 'android';

const isOnlyStudent = (user) => {
  const userType = accountType(user);
  const isOnly = userType !== TEACHER && getStudentId(user).length === 1;
  appStore.isOneStudent(isOnly);
  return isOnly;
};

const getStudentId = (user) => {
  const userType = accountType(user);
  return userType === STUDENT ? [get(user, ['_id'])] : childrenIds(user);
};

const navigateCategoryOrStudentSelect = (navigator, videoUri, user) => {
  return navigator.navigate(isOnlyStudent(user) ? 'CategorySelect': 'StudentSelect',
    { videoUri,
      ...isOnlyStudent(user) && { studentIds: getStudentId(user), onlyStudent: true }
    })
};

const rotationModulus = 180;

const nonLandscapeAlert = () => Alert.alert(
  'Please choose another video.',
  'Only videos shot in landscape mode can be uploaded to FiddleQuest.',
  [
    {text: 'OK'},
  ],
  { cancelable: true }
);

const CachingVideo = () => {
  const navigation = useNavigation();
  const route = useRoute();
  useKeepAwake();

  useEffect(() => {
    const user = Meteor.user();
    const uploadedVideoInfo = get(route, ['params', 'videoInfo']);
    const uriFromCamera = get(route, ['params', 'videoForSaveUri']);

    const goBackIfPortrait = async() => {
      if (uploadedVideoInfo) {
        if (isAndroid && uploadedVideoInfo.rotation % rotationModulus !==0) {
          nonLandscapeAlert();
          navigation.canGoBack();
          // throw 'nonLandscapeVideo';
        }
  
        if (uploadedVideoInfo.height > uploadedVideoInfo.width) {
          nonLandscapeAlert();
          navigation.navigate('Home');
          throw 'nonLandscapeVideo';
        }
  
        navigateCategoryOrStudentSelect(navigation, uploadedVideoInfo.uri, user);
      }
    }

    goBackIfPortrait();

    uriFromCamera && MediaLibrary.saveToLibraryAsync(uriFromCamera).then(() =>
      {
        console.log('saving complete');
        navigateCategoryOrStudentSelect(navigation, uriFromCamera, user);
      }
    );

  }, [navigation])

  return (<View style={styles.container}>
    <ActivityIndicator size='large' />
    <Text>Video processing...</Text>
  </View>)
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CachingVideo;
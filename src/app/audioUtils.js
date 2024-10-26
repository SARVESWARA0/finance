export const saveAudioToFile = async (audioBlob) => {
    try {
      // Create a unique filename using timestamp
      const timestamp = new Date().getTime();
      const filename = `voice_message_${timestamp}.webm`;
      
      // Create a File object from the Blob
      const audioFile = new File([audioBlob], filename, {
        type: 'audio/webm',
        lastModified: Date.now()
      });
      
      return audioFile;
    } catch (error) {
      console.error('Error saving audio:', error);
      throw new Error('Failed to save audio file');
    }
  };
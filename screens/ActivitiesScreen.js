import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
function Activity(props){
  return(
    <View style={styles.activity}>
      <View style={{backgroundColor: "#ddd", width: 30, height: 30}}></View>
      <View style={{backgroundColor: "yellow", width: "calc(100% - 10px - 30px - 60px)", boxSizing: "border-box"}}>
	<Text numberOfLines={1} style={{fontWeight: 400}}>Rua 1 depois do golfe, entrada da matanga</Text>
	<Text>5 mai, 20:00, 5000,00kz</Text>
      </View>
      <View style={{width: 60, height: 30, borderRadius: 10, backgroundColor: "#ddd"}}></View>
    </View>
  );
}

function ActivitiesGroup(props){
  return(
    <View style={styles.activitiesGroup}>
      <Text style={{fontWeight: "bold", fontSize: 14}}>{props.date}</Text>
      <Activity />
      <Activity />
      <Activity />
      <Activity />
      <Activity />
    </View>
  );
}


function ActivitiesList(){
  return(
    <ScrollView style={styles.activitiesList} contentContainerStyle={{gap: 10}}>
      <ActivitiesGroup date="Maio 2024"/>
      <ActivitiesGroup date="Abril 2024"/>
      <ActivitiesGroup date="Fevereiro 2024"/>
      <ActivitiesGroup date="Dezembro 2023"/>
    </ScrollView>
  );
}

export default function ActivitiesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Minhas atividades</Text>
      <ActivitiesList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    gap: 20,
  },
  mainTitle : {
    fontSize: 22,
    fontWeight: "bold",
    backgroundColor: "blue"
  },
  activitiesList: {
    flex: 1,
    gap: 10,
    backgroundColor: "red",
    height: "100%"
  },
  activitiesGroup: {
    gap: 5,
    width: "100%",
    backgroundColor: "blue"
  },
  activity: {
    flexDirection: "row",
    gap: 5,
    height: 50,
    alignItems: "center",
    justifyContent: "space-between"
  }
});

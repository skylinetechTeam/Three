import React from "react";
import {useState, useEffect} from "react";
import { Pressable, ScrollView, View, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";


function Activity(props){
  return(
    <View style={styles.activity}>
      <View style={{backgroundColor: "#eaeaea", width: 35, height: 35, borderRadius: 30, alignItems: "center", justifyContent: "center"}}>
	<Ionicons name="car" size={28} color="#000" />
      </View>
      <View style={{width: "calc(100% - 35px - 20px - 90px)", boxSizing: "border-box"}}>
	<Text numberOfLines={1} style={{fontWeight: 400, fontSize: 14, letterSpacing: 0.5}}>{props.descricao}</Text>
	<Text style={{fontSize: 11, color: "#00000055", letterSpacing: 0.5}}>{props.data}</Text>
      </View>
      <View style={{width: 90, height: 30, borderRadius: 30, backgroundColor: "#eaeaea", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingLeft: 7, paddingRight: 7}}>
	<Ionicons name="reload" size={23} color="#000" />
	<Text style={{fontWeight: "bold", fontSize: 14, letterSpacing: 0.5}}>Repetir</Text>
      </View>
    </View>
  );
}

function ActivitiesGroup(props){
  if(!props.activities) return null;
  return(
    <View style={styles.activitiesGroup}>
      <Text style={{fontWeight: "bold", fontSize: 14, letterSpacing: 0.3}}>{props.date}</Text>
      	{
	  props.activities.map(function(elemento, index){
	    return <Activity key={"txt"+index} data={elemento.data} descricao={elemento.descricao}/>
	  })
	}
    </View>
  );
}

function ActivitiesList({children}){
  return(
    <ScrollView style={styles.activitiesList} contentContainerStyle={{gap: 20}}>
      {
	children
      }
    </ScrollView>
  );
}

export default function ActivitiesScreen() {
  const [activitiesGroupTitles, setActivitiesGroupTitles] = useState(["Maio 2024", "Abril 2024"]);
  const [activitiesGroupActivities, setActivitiesGroupActivities] = useState([[{descricao:"Rua do Kikagil, Luanda", data:"5 mai, 20:00, 5000,00kz"}], [
{descricao:"Rua do Kikagil, Luanda", data:"5 mai, 20:00, 5000,00kz"},{descricao:"Rua do Kikagil, Luanda", data:"5 mai,  20:00, 5000,00kz"}]]);
  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Minhas atividades</Text>
      <ActivitiesList>
	{
	  activitiesGroupActivities.length < 1 && <Text style={{color: "#00000077"}}>Sem actividades registradas</Text>
	}
	{
          activitiesGroupActivities.map(function(elemento, index){
	    return(
	      <ActivitiesGroup key={"atGroup"+index} date={activitiesGroupTitles[index]} activities={elemento} />
	    );
	  })
	}
      </ActivitiesList>
      {/*<Pressable style={{padding:10, borderRadius: 30, backgroundColor:"#358bff", height: "fit-content", width: "100%"}} onPress={()=>{setActivitiesGroupActivities([])}}>
	<Text style={{width: "100%", textAlign: "center", color: "white", fontWeight: "bold"}}>Clique</Text>
      </Pressable>*/}
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
    fontSize: 24,
    fontWeight: "bold",
  },
  activitiesList: {
    flex: 1,
    height: "100%",
  },
  activitiesGroup: {
    gap: 5,
    width: "100%",
  },
  activity: {
    flexDirection: "row",
    gap: 10,
    height: 50,
    alignItems: "center",
    justifyContent: "space-between"
  }
});

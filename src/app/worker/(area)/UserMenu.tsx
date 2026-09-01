import UserMenuDropdown, { UserMenuLink } from "@/components/UserMenuDropdown";

/**
 * Menu do usuário logado (Prompts 11, 12, 15 e 17) — todos os itens de navegação do
 * worker ficam dentro do dropdown do nome, como lista única (sem grupos, diferente do
 * admin — Prompt 16); a barra horizontal não tem mais nenhum link solto.
 */
export default function UserMenu({
  nome,
  sairAction,
}: {
  nome: string;
  sairAction: (formData: FormData) => void;
}) {
  return (
    <UserMenuDropdown label={nome}>
      <UserMenuLink href="/worker/pedidos">Pedidos Recebidos</UserMenuLink>
      <UserMenuLink href="/worker/orcamentos">Meus Orçamentos</UserMenuLink>
      <UserMenuLink href="/worker/strikes">Strikes</UserMenuLink>
      <UserMenuLink href="/worker/agenda">Agenda</UserMenuLink>
      <UserMenuLink href="/worker/ganhos">Meus Ganhos</UserMenuLink>
      <UserMenuLink href="/worker/destaque">Destaque</UserMenuLink>
      <UserMenuLink href="/worker/portfolio">Portfólio</UserMenuLink>
      <UserMenuLink href="/worker/perfil">Meu Perfil</UserMenuLink>
      <form action={sairAction}>
        <button
          type="submit"
          className="block w-full border-t border-stone-100 px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
        >
          Sair
        </button>
      </form>
    </UserMenuDropdown>
  );
}
